import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
// Load env variables early
dotenv.config();
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  CreateTableCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import crypto from 'crypto';
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {docClient, PutCommand} from './db.js';
import {
  BatchGetCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import {profile} from 'console';
import http from 'http';
import {Server, Socket} from 'socket.io';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.json());

// Use hosting provider's PORT or fallback to 4000
const PORT = process.env.PORT || 4000;

// AWS configuration from env; use default provider chain if not provided
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';
const awsCredentials = (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
  : undefined;
const dynamoDbClient = new DynamoDBClient({
  region: AWS_REGION,
  credentials: awsCredentials,
});

// Auto-create table for activity streaks if not present
const ACTIVITY_TABLE = 'user_activity';
async function ensureActivityTable() {
  try {
    await dynamoDbClient.send(new DescribeTableCommand({ TableName: ACTIVITY_TABLE }));
    console.log(`[DynamoDB] Table ${ACTIVITY_TABLE} already exists`);
  } catch (err) {
    if (err?.name === 'ResourceNotFoundException') {
      console.log(`[DynamoDB] Creating table ${ACTIVITY_TABLE}...`);
      const params = {
        TableName: ACTIVITY_TABLE,
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'activityDate', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'activityDate', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };
      await dynamoDbClient.send(new CreateTableCommand(params));
      console.log(`[DynamoDB] Table ${ACTIVITY_TABLE} created`);
    } else {
      console.log('[DynamoDB] Describe/Create table error', err);
    }
  }
}

// Ensure admins table exists
const ADMINS_TABLE = 'admins';
async function ensureAdminsTable() {
  try {
    await dynamoDbClient.send(new DescribeTableCommand({ TableName: ADMINS_TABLE }));
    console.log('[DynamoDB] Table admins already exists');
  } catch (err) {
    if (err?.name === 'ResourceNotFoundException') {
      console.log('[DynamoDB] Creating table admins...');
      const params = {
        TableName: ADMINS_TABLE,
        AttributeDefinitions: [
          { AttributeName: 'adminId', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'adminId', KeyType: 'HASH' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };
      await dynamoDbClient.send(new CreateTableCommand(params));
      console.log('[DynamoDB] Table admins created');
    } else {
      console.log('[DynamoDB] Describe/Create admins table error', err);
    }
  }
}

// Ensure call logs table exists
const CALL_LOGS_TABLE = 'call_logs';
async function ensureCallLogsTable() {
  try {
    await dynamoDbClient.send(new DescribeTableCommand({ TableName: CALL_LOGS_TABLE }));
    console.log('[DynamoDB] Table call_logs already exists');
  } catch (err) {
    if (err?.name === 'ResourceNotFoundException') {
      console.log('[DynamoDB] Creating table call_logs...');
      const params = {
        TableName: CALL_LOGS_TABLE,
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'callId', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'callId', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };
      await dynamoDbClient.send(new CreateTableCommand(params));
      console.log('[DynamoDB] Table call_logs created');
    } else {
      console.log('[DynamoDB] Describe/Create call_logs table error', err);
    }
  }
}

async function seedDefaultAdmin() {
  try {
    const email = 'piyushraval2474@gmail.com';
    const adminId = email;
    const existing = await docClient.send(new GetCommand({
      TableName: ADMINS_TABLE,
      Key: { adminId },
      ProjectionExpression: 'adminId',
    }));
    if (existing?.Item) {
      console.log('[Admins] Default admin already present');
      return;
    }
    const passwordHash = await bcrypt.hash('@Piyush24', 10);
    await docClient.send(new PutCommand({
      TableName: ADMINS_TABLE,
      Item: { adminId, email, passwordHash, createdAt: Date.now() },
      ConditionExpression: 'attribute_not_exists(adminId)'
    }));
    console.log('[Admins] Default admin seeded');
  } catch (e) {
    console.log('[Admins] Seed default admin error', e?.message || e);
  }
}

// Kick off ensure-table on server start only if credentials are present
if (awsCredentials) {
  ensureActivityTable();
  ensureAdminsTable().then(() => seedDefaultAdmin());
  ensureCallLogsTable();
} else {
  console.warn('[DynamoDB] AWS credentials not set; skipping ensureActivityTable');
  console.warn('[DynamoDB] AWS credentials not set; skipping ensureAdminsTable');
  console.warn('[DynamoDB] AWS credentials not set; skipping ensureCallLogsTable');
}

const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION,
  credentials: awsCredentials,
});

// Cognito App Client ID
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

const server = http.createServer(app);

app.post('/register', async (req, res) => {
  try {
    const userData = req.body;

    console.log('Data', userData);

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const userId = crypto.randomUUID();

    const newUser = {
      userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
      gender: userData.gender,
      dateOfBirth: userData.dateOfBirth,
      type: userData.type,
      location: userData.location,
      hometown: userData.hometown,
      workPlace: userData.workPlace,
      jobTitle: userData.jobTitle,
      datingPreferences: userData.datingPreferences || [],
      lookingFor: userData.lookingFor,
      imageUrls: userData.imageUrls,
      prompts: userData.prompts,
      likes: 2,
      roses: 5,
      likedProfiles: [],
      receivedLikes: [],
      matches: [],
      blockedUsers: [],
      streakCount: 0,
      lastActiveAt: new Date().toISOString(),
    };

    const params = {
      TableName: 'usercollection',
      Item: newUser,
    };

    await docClient.send(new PutCommand(params));

    const JWT_SECRET = process.env.JWT_SECRET || 'insecure_dev_secret';
    const token = jwt.sign({userId: newUser.userId}, JWT_SECRET);

    res.status(200).json({token});
  } catch (error) {
    console.log('Error creating user', error);
    res.status(500).json({error: 'Internal server error'});
  }
});

app.post('/sendOtp', async (req, res) => {
  const {email, password} = req.body;

  console.log('email', email);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({error: 'Invalid email format.'});
  }

  const signUpParams = {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{Name: 'email', Value: email}],
  };

  try {
    const command = new SignUpCommand(signUpParams);
    await cognitoClient.send(command);

    res.status(200).json({message: 'OTP sent to email!'});
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(400).json({error: 'Failed to send OTP. Please try again.'});
  }
});

app.post('/resendOtp', async (req, res) => {
  const {email} = req.body;

  const resendParams = {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
  };

  try {
    const command = new ResendConfirmationCodeCommand(resendParams);
    await cognitoClient.send(command);

    res.status(200).json({message: 'New otp sent to mail'});
  } catch (error) {
    console.log('Error', error);
  }
});

app.post('/confirmSignup', async (req, res) => {
  const {email, otpCode} = req.body;

  const confirmParams = {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: otpCode,
  };

  try {
    const command = new ConfirmSignUpCommand(confirmParams);
    await cognitoClient.send(command);

    res.status(200).json({message: 'Email verified successfully!'});
  } catch (error) {
    console.log('Error confirming Sign Up', error);
  }
});

app.get('/matches', async (req, res) => {
  const {userId} = req.query;

  // console.log('user', userId);

  try {
    if (!userId) {
      return res.status(400).json({message: 'UserId is required'});
    }

    const userParams = {
      TableName: 'usercollection',
      Key: {userId},
    };

    const userResult = await docClient.send(new GetCommand(userParams));

    if (!userResult.Item) {
      return res.status(404).json({message: 'User not found'});
    }

    const user = {
      userId: userResult.Item.userId,
      gender: userResult.Item.gender,
      datingPreferences:
        userResult.Item.datingPreferences?.map(pref => pref) || [],
      matches: userResult.Item.matches?.map(match => match) || [],
      likedProfiles:
        userResult?.Item.likedProfiles?.map(lp => lp.likedUserId) || [],
    };

    const genderFilter = user?.datingPreferences || [];
    const blockedResp = await docClient.send(new GetCommand({
      TableName: 'usercollection',
      Key: { userId: user.userId },
      ProjectionExpression: 'blockedUsers'
    }));
    const blockedUsers = blockedResp?.Item?.blockedUsers || [];
    const excludeIds = [
      ...user.matches,
      ...user.likedProfiles,
      user.userId,
      ...blockedUsers,
    ];

    const scanParams = {
      TableName: 'usercollection',
      FilterExpression:
        'userId <> :currentUserId AND (contains(:genderPref,gender)) AND NOT contains(:excludedIds,userId)',
      ExpressionAttributeValues: {
        ':currentUserId': user.userId,
        ':genderPref': genderFilter.length > 0 ? genderFilter : ['None'],
        ':excludedIds': excludeIds,
      },
    };

    const scanResult = await docClient.send(new ScanCommand(scanParams));

    const matches = scanResult.Items.map(item => ({
      userId: item?.userId,
      email: item?.email,
      firstName: item?.firstName,
      gender: item?.gender,
      location: item?.location,
      lookingFor: item?.lookingFor,
      dateOfBirth: item.dateOfBirth,
      hometown: item.hometown,
      type: item.type,
      jobTitle: item.jobTitle,
      workPlace: item.workPlace,
      imageUrls: item.imageUrls || [],
      prompts: item?.prompts || [],
    }));

    res.status(200).json({matches});
  } catch (error) {
    console.log('Error fetching matches', error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Utility function to clean DynamoDB data format
const cleanUserData = (userData) => {
  if (!userData) return userData;
  
  const cleaned = { ...userData };
  
  // Clean common fields that might be in DynamoDB format
  if (cleaned.roses && typeof cleaned.roses === 'object' && cleaned.roses.N !== undefined) {
    cleaned.roses = Number(cleaned.roses.N);
  }
  if (cleaned.likes && typeof cleaned.likes === 'object' && cleaned.likes.N !== undefined) {
    cleaned.likes = Number(cleaned.likes.N);
  }
  if (cleaned.likesLastUpdated && typeof cleaned.likesLastUpdated === 'object' && cleaned.likesLastUpdated.S !== undefined) {
    cleaned.likesLastUpdated = cleaned.likesLastUpdated.S;
  }
  
  return cleaned;
};

app.get('/user-info', async (req, res) => {
  const {userId} = req.query;

  console.log('User ID', userId);

  if (!userId) {
    return res.status(400).json({message: 'User id is required'});
  }

  try {
    const params = {
      TableName: 'usercollection',
      Key: {userId},
    };
    const command = new GetCommand(params);
    const result = await docClient.send(command);

    if (!result.Item) {
      return res.status(404).json({message: 'User not found'});
    }

    console.log('res', result);

  // Clean the user data to handle any legacy DynamoDB format
  const cleanedUser = cleanUserData(result.Item);

  // Ensure a minimum of 5 roses for existing users and persist change if needed
  if (cleanedUser.roses === undefined || cleanedUser.roses === null || cleanedUser.roses < 5) {
    try {
      await docClient.send(new UpdateCommand({
        TableName: 'usercollection',
        Key: {userId},
        UpdateExpression: 'SET roses = :minRoses',
        ExpressionAttributeValues: {
          ':minRoses': 5,
        },
      }));
      cleanedUser.roses = 5;
    } catch (updateErr) {
      console.log('Error updating minimum roses', updateErr);
      // Even if persist fails, still return minimum in response
      cleanedUser.roses = 5;
    }
  }

  // Ensure default streak fields
  if (cleanedUser.streakCount === undefined || cleanedUser.streakCount === null) {
    try {
      await docClient.send(new UpdateCommand({
        TableName: 'usercollection',
        Key: {userId},
        UpdateExpression: 'SET streakCount = if_not_exists(streakCount, :default), lastActiveAt = if_not_exists(lastActiveAt, :now)',
        ExpressionAttributeValues: {
          ':default': 0,
          ':now': new Date().toISOString(),
        },
      }));
      cleanedUser.streakCount = 0;
      cleanedUser.lastActiveAt = new Date().toISOString();
    } catch (streakErr) {
      console.log('Error initializing streak fields', streakErr);
      cleanedUser.streakCount = 0;
      cleanedUser.lastActiveAt = new Date().toISOString();
    }
  }

  res.status(200).json({user: cleanedUser});
  } catch (error) {
    console.log('Error fetching user details', error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete account for the authenticated user
app.delete('/account/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User id is required' });
    }
    if (req.user?.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Delete user from main user table
    await docClient.send(new DeleteCommand({
      TableName: 'usercollection',
      Key: { userId },
    }));

    // Best-effort cleanup: remove activity items for this user
    try {
      const q = new QueryCommand({
        TableName: ACTIVITY_TABLE,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': { S: userId } },
      });
      const result = await dynamoDbClient.send(q);
      const items = Array.isArray(result.Items) ? result.Items : [];
      for (const it of items) {
        const key = {
          userId: { S: userId },
          activityDate: it.activityDate,
        };
        await dynamoDbClient.send(new DeleteItemCommand({
          TableName: ACTIVITY_TABLE,
          Key: key,
        }));
      }
    } catch (e) {
      // Ignore activity cleanup errors; deletion of user still succeeds
      console.log('Activity cleanup error', e?.message || e);
    }

    return res.status(200).json({ message: 'Account deleted' });
  } catch (error) {
    console.log('Delete account error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(404).json({message: 'Token is required'});
  }

  const token = authHeader.split(' ')[1];
  console.log('recieived token', token);

  const secretKey =
    '582e6b12ec6da3125121e9be07d00f63495ace020ec9079c30abeebd329986c5c35548b068ddb4b187391a5490c880137c1528c76ce2feacc5ad781a742e2de0'; // Use a better key management

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({message: 'Invalid or expired token'});
    }

    req.user = user;
    next();
  });
}

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(404).json({ message: 'Token is required' });
  }
  const token = authHeader.split(' ')[1];
  const secretKey = '582e6b12ec6da3125121e9be07d00f63495ace020ec9079c30abeebd329986c5c35548b068ddb4b187391a5490c880137c1528c76ce2feacc5ad781a742e2de0';
  jwt.verify(token, secretKey, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    if (!payload?.adminEmail) {
      return res.status(403).json({ message: 'Admin privileges required' });
    }
    req.admin = { email: payload.adminEmail };
    next();
  });
}

// Update profile fields (partial updates)
app.patch('/user-info', authenticateToken, async (req, res) => {
  try {
    const { userId, ...body } = req.body || {};
    if (!userId) {
      return res.status(400).json({ message: 'User id is required' });
    }
    if (req.user?.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    const allowedKeys = new Set([
      // Existing editable fields
      'firstName',
      'jobTitle',
      'workPlace',
      'location',
      'hometown',
      'lookingFor',
      'imageUrls',
      'prompts',
      // Expanded fields requested for full profile editing
      'lastName',
      'gender',
      'dateOfBirth',
      'type',
      'datingPreferences',
    ]);

    const updateKeys = Object.keys(body).filter((k) => allowedKeys.has(k) && body[k] !== undefined);
    if (!updateKeys.length) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const exprNames = {};
    const exprValues = {};
    const setParts = [];
    for (const key of updateKeys) {
      const nameKey = `#${key}`;
      const valueKey = `:${key}`;
      exprNames[nameKey] = key;
      exprValues[valueKey] = body[key];
      setParts.push(`${nameKey} = ${valueKey}`);
    }

    const updateExpr = `SET ${setParts.join(', ')}`;

    const result = await docClient.send(new UpdateCommand({
      TableName: 'usercollection',
      Key: { userId },
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: 'ALL_NEW',
    }));

    const updated = result?.Attributes || {};
    // Clean updated user to avoid legacy format issues
    const cleanedUser = cleanUserData(updated);
    return res.status(200).json({ user: cleanedUser });
  } catch (error) {
    console.log('Error updating user info', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Record daily check-in and update streak
app.post('/activity/check-in', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    // Find latest activity for this user
    const latestQuery = new QueryCommand({
      TableName: ACTIVITY_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': { S: userId } },
      ScanIndexForward: false,
      Limit: 1,
    });
    const latestResult = await dynamoDbClient.send(latestQuery);
    const latestItem = latestResult.Items?.[0] || null;
    const latestDate = latestItem?.activityDate?.S || null;

    // Fetch current streak from user
    const userResult = await docClient.send(new GetCommand({
      TableName: 'usercollection',
      Key: { userId },
      ProjectionExpression: 'streakCount',
    }));
    const currentStreak = Number(userResult?.Item?.streakCount || 0);

    // Put today's activity (idempotent)
    try {
      await dynamoDbClient.send(new PutItemCommand({
        TableName: ACTIVITY_TABLE,
        Item: {
          userId: { S: userId },
          activityDate: { S: today },
        },
        ConditionExpression: 'attribute_not_exists(activityDate)',
      }));
    } catch (putErr) {
      // If already exists, just return current streak
      if (putErr?.name === 'ConditionalCheckFailedException') {
        return res.status(200).json({ message: 'Already checked in today', streakCount: currentStreak });
      }
      throw putErr;
    }

    let newStreak = 1;
    if (latestDate === yesterday) {
      newStreak = currentStreak + 1;
    }

    // Update user streak fields
    await docClient.send(new UpdateCommand({
      TableName: 'usercollection',
      Key: { userId },
      UpdateExpression: 'SET streakCount = :c, lastActiveAt = :now',
      ExpressionAttributeValues: {
        ':c': newStreak,
        ':now': new Date().toISOString(),
      },
    }));

    return res.status(200).json({ message: 'Check-in recorded', streakCount: newStreak, date: today });
  } catch (error) {
    console.log('Error in check-in', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/like-profile', authenticateToken, async (req, res) => {
  const {userId, likedUserId, image, comment = null, type, prompt} = req.body;

  if (req.user.userId !== userId) {
    return res.status(403).json({message: 'unauthorized action'});
  }
  if (!userId || !likedUserId) {
    return res.status(404).json({message: 'Missing required parametered'});
  }

  try {
    const userParams = {
      TableName: 'usercollection',
      Key: {userId},
    };

    const userData = await docClient.send(new GetCommand(userParams));

    if (!userData.Item) {
      return res.status(404).json({message: 'User not found'});
    }

    const user = userData.Item;
    const likesRemaining = user.likes || 0;
    console.log('likes remaining', likesRemaining);
    const likesLastUpdated = user?.likesLastUpdated ? new Date(user.likesLastUpdated) : new Date('1970-01-01');
    console.log('Likes last updated', likesLastUpdated);
    const now = new Date();
    const maxLikes = 2;
    const oneDay = 24 * 60 * 60 * 1000;

    const timeSinceLastUpdate = now - likesLastUpdated;
    
    console.log('Time since last update (hours):', timeSinceLastUpdate / (1000 * 60 * 60));

    if (timeSinceLastUpdate >= oneDay || !user.likesLastUpdated) {
      console.log('Resetting likes to max:', maxLikes);
      const resetParams = {
        TableName: 'usercollection',
        Key: {userId},
        UpdateExpression: 'SET likes = :maxLikes, likesLastUpdated = :now',
        ExpressionAttributeValues: {
          ':maxLikes': maxLikes,
          ':now': now.toISOString(),
        },
      };
      await docClient.send(new UpdateCommand(resetParams));

      user.likes = maxLikes;
    } else if (likesRemaining <= 0) {
      console.log('Daily like limit reached for user:', userId);
      return res.status(403).json({
        message: 'Daily like limit reached, please subscribe or try again tomorrow',
        remainingTime: Math.ceil((oneDay - timeSinceLastUpdate) / (1000 * 60 * 60)) + ' hours'
      });
    }

    const newLikes = likesRemaining - 1;

    const decrementLikesParams = {
      TableName: 'usercollection',
      Key: {userId},
      UpdateExpression: 'SET likes = :newLikes',
      ExpressionAttributeValues: {
        ':newLikes': newLikes,
      },
    };

    await docClient.send(new UpdateCommand(decrementLikesParams));

    let newLike = {userId, type};

    if (type == 'image') {
      if (!image) {
        return res.status(404).json({message: 'Image url is required'});
      }
      newLike.image = image;
    } else if (type == 'prompt') {
      if (!prompt || !prompt.question || !prompt.answer) {
        return res.status(400).json({message: 'Prompts are required'});
      }
      newLike.prompt = prompt;
    }

    if (comment) {
      newLike.comment = comment;
    }

    //step 1
    const updatedReceivedLikesParams = {
      TableName: 'usercollection',
      Key: {userId: likedUserId},
      UpdateExpression:
        'SET receivedLikes = list_append(if_not_exists(receivedLikes, :empty_list), :newLike)',
      ExpressionAttributeValues: {
        ':newLike': [newLike],
        ':empty_list': [],
      },
      ReturnValues: 'UPDATED_NEW',
    };

    await docClient.send(new UpdateCommand(updatedReceivedLikesParams));

    //step 2

    const updatedLikedParams = {
      TableName: 'usercollection',
      Key: {userId},
      UpdateExpression:
        'SET likedProfiles = list_append(if_not_exists(likedProfiles, :empty_list), :likedUserId)',
      ExpressionAttributeValues: {
        ':likedUserId': [{likedUserId}],
        ':empty_list': [],
      },
      ReturnValues: 'UPDATED_NEW',
    };

    await docClient.send(new UpdateCommand(updatedLikedParams));

    // Check if this creates a mutual like (automatic matching)
    const likedUserResponse = await docClient.send(new GetCommand({
      TableName: 'usercollection',
      Key: {userId: likedUserId},
      ProjectionExpression: 'likedProfiles'
    }));

    const likedUserProfiles = likedUserResponse?.Item?.likedProfiles || [];
    const hasMutualLike = likedUserProfiles.some(profile => profile.likedUserId === userId);

    if (hasMutualLike) {
      // Auto-create match when both users have liked each other
      console.log('Creating automatic match between users:', userId, 'and', likedUserId);
      
      // Add each user to the other's matches array
      const addMatchForUser1 = {
        TableName: 'usercollection',
        Key: {userId},
        UpdateExpression: 'SET matches = list_append(if_not_exists(matches, :empty_list), :matchedUserList)',
        ConditionExpression: 'attribute_not_exists(matches) OR NOT contains(matches, :matchedUserVal)',
        ExpressionAttributeValues: {
          ':matchedUserList': [likedUserId],
          ':matchedUserVal': likedUserId,
          ':empty_list': [],
        },
      };
      
      const addMatchForUser2 = {
        TableName: 'usercollection',
        Key: {userId: likedUserId},
        UpdateExpression: 'SET matches = list_append(if_not_exists(matches, :empty_list), :matchedUserList)',
        ConditionExpression: 'attribute_not_exists(matches) OR NOT contains(matches, :matchedUserVal)',
        ExpressionAttributeValues: {
          ':matchedUserList': [userId],
          ':matchedUserVal': userId,
          ':empty_list': [],
        },
      };
      
      await Promise.all([
        docClient.send(new UpdateCommand(addMatchForUser1)),
        docClient.send(new UpdateCommand(addMatchForUser2))
      ]);
      
      console.log('Automatic match created successfully!');
      return res.status(200).json({message: 'Profile liked and match created!', matched: true});
    }

    res.status(200).json({message: 'Profile Likes succesfully!', matched: false});
  } catch (error) {
    console.log('Error liking', error);
    res.status(500).json({message: 'Internal server error'});
  }
});

app.get('/received-likes/:userId', authenticateToken, async (req, res) => {
  const {userId} = req.params;

  console.log('User', userId);

  try {
    const params = {
      TableName: 'usercollection',
      Key: {userId: userId},
      ProjectionExpression: 'receivedLikes',
    };

    const data = await docClient.send(new GetCommand(params));
    console.log('User', data);

    if (!data.Item) {
      return res.status(404).json({message: 'User not found'});
    }

    const receivedLikes = data?.Item?.receivedLikes || [];

    const enrichedLikes = await Promise.all(
      receivedLikes.map(async like => {
        const userParams = {
          TableName: 'usercollection',
          Key: {userId: like.userId},
          ProjectionExpression: 'userId, firstName, imageUrls, prompts',
        };

        const userData = await docClient.send(new GetCommand(userParams));
        console.log('User data', userData);

        const user = userData?.Item
          ? {
              userId: userData.Item.userId,
              firstName: userData.Item.firstName,
              imageUrls: userData.Item.imageUrls || null,
              prompts: userData.Item.prompts,
            }
          : {userId: like.userId, firstName: null, imageUrl: null};

        return {...like, userId: user};
      }),
    );

    console.log('Encriches', enrichedLikes);

    res.status(200).json({receivedLikes: enrichedLikes});
  } catch (error) {
    console.log('Error getting the likes');
    res.status(500).json({message: 'Internal server error'});
  }
});

app.post('/login', async (req, res) => {
  const {email, password} = req.body;

  console.log('Email', email);
  console.log('password', password);

  if (!email || !password) {
    return res.status(400).json({message: 'Email and password are required'});
  }

  const authParams = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  try {
    const authCommand = new InitiateAuthCommand(authParams);
    const authResult = await cognitoClient.send(authCommand);

    const {IdToken, AccessToken, RefreshToken} =
      authResult.AuthenticationResult;

    // Alternative approach using scan instead of query (less efficient but works without GSI)
    const userParams = {
      TableName: 'usercollection',
      FilterExpression: 'email = :emailValue',
      ExpressionAttributeValues: {
        ':emailValue': email,
      },
    };

    const userResult = await docClient.send(new ScanCommand(userParams));

    if (!userResult.Items || userResult.Items.length == 0) {
      return res.status(404).json({error: 'User not found'});
    }

    const user = userResult.Items[0];
    // If account is blocked by admin, deny login
    if (user?.accountBlocked) {
      return res.status(403).json({ message: 'Account blocked' });
    }
    const userId = user?.userId;

    const secretKey =
      '582e6b12ec6da3125121e9be07d00f63495ace020ec9079c30abeebd329986c5c35548b068ddb4b187391a5490c880137c1528c76ce2feacc5ad781a742e2de0'; // Use a better key management

    const token = jwt.sign({userId: userId, email: email}, secretKey);

    res.status(200).json({token, IdToken, AccessToken});
  } catch (error) {
    console.log('Login error', error?.name || error?.message || error);
    // Map Cognito errors to sensible HTTP statuses/messages
    const name = error?.name || '';
    if (name === 'NotAuthorizedException') {
      return res.status(401).json({message: 'Incorrect password'});
    }
    if (name === 'UserNotFoundException') {
      return res.status(404).json({message: 'Email not found'});
    }
    if (name === 'UserNotConfirmedException') {
      return res.status(403).json({message: 'Account not confirmed'});
    }
    if (name === 'PasswordResetRequiredException') {
      return res.status(403).json({message: 'Password reset required'});
    }
    return res.status(500).json({message: 'Login failed'});
  }
});

// Admin login: verify against admins table and issue admin token
app.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const adminId = email;
    const existing = await docClient.send(new GetCommand({
      TableName: ADMINS_TABLE,
      Key: { adminId },
    }));
    const admin = existing?.Item;
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    const secretKey = '582e6b12ec6da3125121e9be07d00f63495ace020ec9079c30abeebd329986c5c35548b068ddb4b187391a5490c880137c1528c76ce2feacc5ad781a742e2de0';
    const token = jwt.sign({ adminEmail: email }, secretKey);
    return res.status(200).json({ token });
  } catch (error) {
    console.log('Admin login error', error?.name || error?.message || error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

async function getIndexToRemove(selectedUserId, currentUserId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: 'usercollection',
      Key: {userId: selectedUserId},
      ProjectionExpression: 'likedProfiles',
    }),
  );

  const likedProfiles = result?.Item?.likedProfiles || [];
  return likedProfiles?.findIndex(
    profile => profile.likedUserId == currentUserId,
  );
}

app.post('/create-match', authenticateToken, async (req, res) => {
  try {
    console.log('Hey');
    const {currentUserId, selectedUserId} = req.body;

    console.log('current', currentUserId);
    console.log('selected', selectedUserId);

    const userResponse = await docClient.send(
      new GetCommand({
        TableName: 'usercollection',
        Key: {userId: currentUserId},
      }),
    );

    const receivedLikes = userResponse?.Item?.receivedLikes || [];

    // Remove ALL likes from selectedUserId in currentUser's receivedLikes
    const filteredReceivedLikes = receivedLikes.filter(
      like => like.userId !== selectedUserId,
    );

    // Fetch selected user's likedProfiles to remove ALL occurrences of currentUserId
    const selectedUserLikedProfilesResponse = await docClient.send(
      new GetCommand({
        TableName: 'usercollection',
        Key: {userId: selectedUserId},
        ProjectionExpression: 'likedProfiles',
      }),
    );

    const selectedUserLikedProfiles =
      selectedUserLikedProfilesResponse?.Item?.likedProfiles || [];

    const filteredLikedProfiles = selectedUserLikedProfiles.filter(
      profile => profile?.likedUserId !== currentUserId,
    );

    // First, append match for selected user if not already present (idempotent)
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: 'usercollection',
          Key: {userId: selectedUserId},
          UpdateExpression:
            'SET #matches = list_append(if_not_exists(#matches, :emptyList), :currentUserList)',
          ConditionExpression:
            'attribute_not_exists(#matches) OR NOT contains(#matches, :currentUserVal)',
          ExpressionAttributeNames: {
            '#matches': 'matches',
          },
          ExpressionAttributeValues: {
            ':currentUserList': [currentUserId],
            ':currentUserVal': currentUserId,
            ':emptyList': [],
          },
        }),
      );
    } catch (err) {
      const isConditional =
        err?.name === 'ConditionalCheckFailedException' ||
        String(err?.__type || '').includes('ConditionalCheckFailedException');
      if (!isConditional) throw err; // ignore duplicate; continue
    }

    // Remove ALL likedProfiles entries for currentUserId from selected user's list
    await docClient.send(
      new UpdateCommand({
        TableName: 'usercollection',
        Key: {userId: selectedUserId},
        UpdateExpression: 'SET #likedProfiles = :filteredLikedProfiles',
        ExpressionAttributeNames: {
          '#likedProfiles': 'likedProfiles',
        },
        ExpressionAttributeValues: {
          ':filteredLikedProfiles': filteredLikedProfiles,
        },
      }),
    );

    try {
      await docClient.send(
        new UpdateCommand({
          TableName: 'usercollection',
          Key: {userId: currentUserId},
          UpdateExpression:
            'SET #matches = list_append(if_not_exists(#matches, :emptyList), :selectedUserList)',
          ConditionExpression:
            'attribute_not_exists(#matches) OR NOT contains(#matches, :selectedUserVal)',
          ExpressionAttributeNames: {
            '#matches': 'matches',
          },
          ExpressionAttributeValues: {
            ':selectedUserList': [selectedUserId],
            ':selectedUserVal': selectedUserId,
            ':emptyList': [],
          },
        }),
      );
    } catch (err) {
      const isConditional =
        err?.name === 'ConditionalCheckFailedException' ||
        String(err?.__type || '').includes('ConditionalCheckFailedException');
      if (!isConditional) throw err; // ignore duplicate; continue
    }

    // Persist filtered receivedLikes so none of this user's likes remain
    await docClient.send(
      new UpdateCommand({
        TableName: 'usercollection',
        Key: {userId: currentUserId},
        UpdateExpression: 'SET #receivedLikes = :filteredReceivedLikes',
        ExpressionAttributeNames: {
          '#receivedLikes': 'receivedLikes',
        },
        ExpressionAttributeValues: {
          ':filteredReceivedLikes': filteredReceivedLikes,
        },
      }),
    );

    res.status(200).json({message: 'Match created successfully!'});
  } catch (error) {
    console.log('Error creating a match', error);
  }
});

app.get('/get-matches/:userId', authenticateToken, async (req, res) => {
  try {
    const {userId} = req.params;

    const userResult = await docClient.send(
      new GetCommand({
        TableName: 'usercollection',
        Key: {userId},
        ProjectionExpression: 'matches',
      }),
    );

    const matches = userResult?.Item?.matches || [];
    // De-duplicate match IDs to avoid DynamoDB BatchGet validation errors
    const uniqueMatches = Array.from(new Set(matches.filter(id => !!id)));

    if (!uniqueMatches.length) {
      return res.status(200).json({matches: []});
    }

    const batchGetParams = {
      RequestItems: {
        usercollection: {
          Keys: uniqueMatches.map(matchId => ({userId: matchId})),
          ProjectionExpression: 'userId, firstName, imageUrls, prompts',
        },
      },
    };

    const matchResult = await docClient.send(
      new BatchGetCommand(batchGetParams),
    );

    const matchedUsersRaw = matchResult?.Responses?.usercollection || [];
    // Exclude users that current user has blocked
    const blockedResp = await docClient.send(new GetCommand({
      TableName: 'usercollection',
      Key: { userId },
      ProjectionExpression: 'blockedUsers'
    }));
    const blockedUsers = blockedResp?.Item?.blockedUsers || [];
    const matchedUsers = matchedUsersRaw.filter(u => !blockedUsers.includes(u.userId));

    res.status(200).json({matches: matchedUsers});
  } catch (error) {
    console.log('Error getting matches', error);
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Socket.IO initialized below with explicit CORS settings

const userSocketMap = {};
const userPresence = {};
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR);
  } catch (e) {
    console.log('Error creating uploads dir', e?.message);
  }
}
app.use('/uploads', express.static(UPLOAD_DIR));

// Configure Socket.IO to accept external origins when hosted
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Active calls keyed by "caller->callee"
const activeCalls = new Map();

io.on('connection', socket => {
  const userIdRaw = socket.handshake.query.userId;
  const userId = userIdRaw !== undefined ? String(userIdRaw) : undefined;

  if (userId !== undefined) {
    userSocketMap[userId] = socket.id;
    userPresence[userId] = { online: true, lastSeen: new Date().toISOString() };
  }

  console.log('User socket data', userSocketMap);

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
    if (userId !== undefined) {
      delete userSocketMap[userId];
      userPresence[userId] = { online: false, lastSeen: new Date().toISOString() };
    }
  });

  socket.on('sendMessage', ({senderId, receiverId, message}) => {
    const receiverSocketId = userSocketMap[String(receiverId)];

    console.log('receiver ID', receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', {
        senderId,
        message,
      });
    }
  });

  // Typing indicator events (ephemeral, no DB changes)
  socket.on('typing', ({senderId, receiverId}) => {
    const receiverSocketId = userSocketMap[String(receiverId)];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', {senderId});
    }
  });

  socket.on('stopTyping', ({senderId, receiverId}) => {
    const receiverSocketId = userSocketMap[String(receiverId)];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('stopTyping', {senderId});
    }
  });

  // Video call signaling events
  socket.on('call:invite', ({from, to}) => {
    const callId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${from}-${to}`;
    activeCalls.set(`${from}->${to}`, { callId, from, to, startTime: null });
    const receiverSocketId = userSocketMap[String(to)];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call:incoming', {from, callId});
    }
    // Push notification for incoming call (if device token exists)
    (async () => {
      try {
        const resp = await docClient.send(
          new GetCommand({
            TableName: 'usercollection',
            Key: {userId: String(to)},
            ProjectionExpression: 'deviceToken',
          }),
        );
        const token = resp?.Item?.deviceToken;
        if (token) {
          await sendPushNotification(token, 'Incoming call', 'You have a video call', {
            type: 'call',
            from,
          });
        }
      } catch (e) {
        console.log('Error sending call push', e?.response?.data || e?.message || e);
      }
    })();

    // Create initial outgoing log for caller (ringing)
    (async () => {
      try {
        const nowIso = dayjs().toISOString();
        await docClient.send(new PutCommand({
          TableName: CALL_LOGS_TABLE,
          Item: {
            userId: String(from),
            callId: String(callId),
            direction: 'outgoing',
            peerId: String(to),
            status: 'ringing',
            startTime: null,
            endTime: null,
            durationSec: 0,
            kind: 'video',
            createdAt: nowIso,
          },
        }));
      } catch (e) {
        console.log('[call_logs] invite log error', e?.message || e);
      }
    })();
  });

  // Accept/Reject should notify the original caller (userId = `to`)
  socket.on('call:accept', ({from, to}) => {
    const callerSocketId = userSocketMap[String(to)];
    if (callerSocketId) {
      // Send both ids so client can match on `from` (callee)
      const active = activeCalls.get(`${to}->${from}`) || activeCalls.get(`${to}->${from}`);
      const callId = active?.callId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${to}-${from}`);
      io.to(callerSocketId).emit('call:accepted', { from, to, callId });
    }

    // Mark logs for both sides as in_progress and set startTime
    (async () => {
      try {
        const key = `${to}->${from}`; // invite was from caller `to` to callee `from`
        const rec = activeCalls.get(key);
        const callId = rec?.callId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${to}-${from}`);
        const startIso = dayjs().toISOString();
        activeCalls.set(key, { ...(rec || { from: to, to: from }), callId, startTime: startIso });

        // Caller perspective
        await docClient.send(new PutCommand({
          TableName: CALL_LOGS_TABLE,
          Item: {
            userId: String(to),
            callId: String(callId),
            direction: 'outgoing',
            peerId: String(from),
            status: 'in_progress',
            startTime: startIso,
            endTime: null,
            durationSec: 0,
            kind: 'video',
            createdAt: startIso,
          },
        }));
        // Callee perspective
        await docClient.send(new PutCommand({
          TableName: CALL_LOGS_TABLE,
          Item: {
            userId: String(from),
            callId: String(callId),
            direction: 'incoming',
            peerId: String(to),
            status: 'in_progress',
            startTime: startIso,
            endTime: null,
            durationSec: 0,
            kind: 'video',
            createdAt: startIso,
          },
        }));
      } catch (e) {
        console.log('[call_logs] accept log error', e?.message || e);
      }
    })();
  });

  socket.on('call:reject', ({from, to}) => {
    const callerSocketId = userSocketMap[String(to)];
    if (callerSocketId) {
      const active = activeCalls.get(`${to}->${from}`);
      const callId = active?.callId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${to}-${from}`);
      io.to(callerSocketId).emit('call:rejected', { from, to, callId });
    }

    // Record declined for both perspectives
    (async () => {
      try {
        const nowIso = dayjs().toISOString();
        const active = activeCalls.get(`${to}->${from}`);
        const startIso = active?.startTime || null;
        const callId = active?.callId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${to}-${from}`);
        // Caller
        await docClient.send(new PutCommand({
          TableName: CALL_LOGS_TABLE,
          Item: {
            userId: String(to),
            callId: String(callId),
            direction: 'outgoing',
            peerId: String(from),
            status: 'declined',
            startTime: startIso,
            endTime: nowIso,
            durationSec: 0,
            kind: 'video',
            createdAt: startIso || nowIso,
          },
        }));
        // Callee
        await docClient.send(new PutCommand({
          TableName: CALL_LOGS_TABLE,
          Item: {
            userId: String(from),
            callId: String(callId),
            direction: 'incoming',
            peerId: String(to),
            status: 'declined',
            startTime: startIso,
            endTime: nowIso,
            durationSec: 0,
            kind: 'video',
            createdAt: startIso || nowIso,
          },
        }));
        activeCalls.delete(`${to}->${from}`);
      } catch (e) {
        console.log('[call_logs] reject log error', e?.message || e);
      }
    })();
  });

  socket.on('webrtc:offer', ({from, to, sdp}) => {
    const receiverSocketId = userSocketMap[String(to)];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('webrtc:offer', {from, sdp});
    }
  });

  socket.on('webrtc:answer', ({from, to, sdp}) => {
    const receiverSocketId = userSocketMap[String(to)];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('webrtc:answer', {from, sdp});
    }
  });

  socket.on('webrtc:candidate', ({from, to, candidate}) => {
    const receiverSocketId = userSocketMap[String(to)];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('webrtc:candidate', {from, candidate});
    }
  });

  socket.on('call:end', ({from, to}) => {
    const receiverSocketId = userSocketMap[String(to)];
    if (receiverSocketId) {
      const active = activeCalls.get(`${from}->${to}`) || activeCalls.get(`${to}->${from}`);
      const callId = active?.callId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${from}-${to}`);
      io.to(receiverSocketId).emit('call:end', {from, callId});
    }

    // Complete or cancel logs
    (async () => {
      try {
        const rec = activeCalls.get(`${from}->${to}`) || activeCalls.get(`${to}->${from}`);
        const startIso = rec?.startTime || null;
        const callId = rec?.callId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${from}-${to}`);
        const endIso = dayjs().toISOString();
        const dur = startIso ? Math.max(0, dayjs(endIso).diff(dayjs(startIso), 'second')) : 0;
        const status = startIso ? 'completed' : 'no_answer';
        // For emitter perspective
        await docClient.send(new PutCommand({
          TableName: CALL_LOGS_TABLE,
          Item: {
            userId: String(from),
            callId: String(callId),
            direction: 'outgoing',
            peerId: String(to),
            status,
            startTime: startIso,
            endTime: endIso,
            durationSec: dur,
            kind: 'video',
            createdAt: startIso || endIso,
          },
        }));
        // Counterparty perspective
        await docClient.send(new PutCommand({
          TableName: CALL_LOGS_TABLE,
          Item: {
            userId: String(to),
            callId: String(callId),
            direction: 'incoming',
            peerId: String(from),
            status: startIso ? 'completed' : 'missed',
            startTime: startIso,
            endTime: endIso,
            durationSec: dur,
            kind: 'video',
            createdAt: startIso || endIso,
          },
        }));
        activeCalls.delete(`${from}->${to}`);
        activeCalls.delete(`${to}->${from}`);
      } catch (e) {
        console.log('[call_logs] end log error', e?.message || e);
      }
    })();
  });

  // Message reactions (ephemeral, relayed via socket)
  socket.on('messages:reaction', ({ messageId, reaction, senderId, receiverId }) => {
    try {
      if (!messageId || !reaction || !senderId || !receiverId) return;
      const receiverSocketId = userSocketMap[receiverId];
      const senderSocketId = userSocketMap[senderId];
      const payload = { messageId, reaction, senderId };
      if (receiverSocketId) io.to(receiverSocketId).emit('messages:reaction', payload);
      if (senderSocketId) io.to(senderSocketId).emit('messages:reaction', payload);
    } catch (e) {
      console.log('messages:reaction relay error', e?.message || e);
    }
  });
});

// FCM push notification helper (legacy API key)
const sendPushNotification = async (deviceToken, title, body, data = {}) => {
  try {
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey || !deviceToken) return;
    await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      {
        to: deviceToken,
        notification: {title, body},
        data,
        priority: 'high',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${serverKey}`,
        },
      },
    );
  } catch (error) {
    console.log('FCM send error', error?.response?.data || error?.message || error);
  }
};

// Presence API: returns online state and lastSeen
app.get('/presence', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    const presence = userPresence[userId] || { online: false, lastSeen: null };
    return res.status(200).json(presence);
  } catch (error) {
    console.log('Presence error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/sendMessage', async (req, res) => {
  try {
    const {senderId, receiverId, message, type, audioUrl, imageUrl} = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({error: 'Missing fields'});
    }

    // Block check: do not allow sending if either side has blocked the other
    try {
      const [senderData, receiverData] = await Promise.all([
        docClient.send(new GetCommand({ TableName: 'usercollection', Key: { userId: senderId }, ProjectionExpression: 'blockedUsers' })),
        docClient.send(new GetCommand({ TableName: 'usercollection', Key: { userId: receiverId }, ProjectionExpression: 'blockedUsers' })),
      ]);
      const senderBlocked = senderData?.Item?.blockedUsers || [];
      const receiverBlocked = receiverData?.Item?.blockedUsers || [];
      const isBlocked = senderBlocked.includes(receiverId) || receiverBlocked.includes(senderId);
      if (isBlocked) {
        return res.status(403).json({ message: 'Messaging blocked', blocked: true });
      }
    } catch (e) {
      // fail open if user records missing
    }

    const messageId = crypto.randomUUID();

    const params = {
      TableName: 'messages',
      Item: {
        messageId: {S: messageId},
        senderId: {S: senderId},
        receiverId: {S: receiverId},
        message: {S: message},
        timestamp: {S: new Date().toISOString()},
        ...(type ? {type: {S: type}} : {}),
        ...(audioUrl ? {audioUrl: {S: audioUrl}} : {}),
        ...(imageUrl ? {imageUrl: {S: imageUrl}} : {}),
      },
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      console.log('Emitting new message to the reciever', receiverId);
      io.to(receiverSocketId).emit('newMessage', {
        senderId,
        receiverId,
        message,
        type: type || 'text',
        audioUrl: audioUrl || null,
        imageUrl: imageUrl || null,
        messageId,
      });
      // Mark delivered immediately when receiver is online
      try {
        const updateDelivered = new UpdateItemCommand({
          TableName: 'messages',
          Key: { messageId: { S: messageId } },
          UpdateExpression: 'SET deliveredAt = :ts',
          ExpressionAttributeValues: { ':ts': { S: new Date().toISOString() } },
        });
        await dynamoDbClient.send(updateDelivered);
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:delivered', { messageId });
        }
      } catch (e) {
        console.log('Error marking delivered', e?.message || e);
      }
    } else {
      console.log('Receiver socket ID not found');
    }

    // Push notification to receiver if token exists
    try {
      const resp = await docClient.send(
        new GetCommand({
          TableName: 'usercollection',
          Key: {userId: receiverId},
          ProjectionExpression: 'deviceToken, firstName',
        }),
      );
      const token = resp?.Item?.deviceToken;
      if (token) {
        await sendPushNotification(
          token,
          'New message',
          type === 'audio' ? 'Sent you a voice message' : message,
          {type: 'message', from: senderId},
        );
      }
    } catch (e) {
      console.log('Error sending message push', e?.response?.data || e?.message || e);
    }

    res.status(201).json({message: 'Message sent successfully!'});
  } catch (error) {
    console.log('Error', error);
    res.status(500).json({message: 'internal server error'});
  }
});

app.get('/messages', async (req, res) => {
  try {
    const {senderId, receiverId} = req.query;

    if (!senderId || !receiverId) {
      return res.status(400).json({error: 'missing fields'});
    }

    // Block check for conversation fetch
    try {
      const [senderData, receiverData] = await Promise.all([
        docClient.send(new GetCommand({ TableName: 'usercollection', Key: { userId: senderId }, ProjectionExpression: 'blockedUsers' })),
        docClient.send(new GetCommand({ TableName: 'usercollection', Key: { userId: receiverId }, ProjectionExpression: 'blockedUsers' })),
      ]);
      const senderBlocked = senderData?.Item?.blockedUsers || [];
      const receiverBlocked = receiverData?.Item?.blockedUsers || [];
      if (senderBlocked.includes(receiverId)) {
        return res.status(403).json({ message: 'You blocked this user', blocked: true, blockedByPeer: false });
      }
      if (receiverBlocked.includes(senderId)) {
        return res.status(403).json({ message: 'You are blocked by this user', blocked: true, blockedByPeer: true });
      }
    } catch (e) {
      // fail open
    }

    const senderQueryParams = {
      TableName: 'messages',
      IndexName: 'senderId-index',
      KeyConditionExpression: 'senderId = :senderId',
      ExpressionAttributeValues: {
        ':senderId': {S: senderId},
      },
    };

    const receiverQueryParams = {
      TableName: 'messages',
      IndexName: 'receiverId-index',
      KeyConditionExpression: 'receiverId = :receiverId',
      ExpressionAttributeValues: {
        ':receiverId': {S: senderId},
      },
    };

    const senderQueryCommand = new QueryCommand(senderQueryParams);
    const receiverQueryCommand = new QueryCommand(receiverQueryParams);

    const senderResults = await dynamoDbClient.send(senderQueryCommand);
    const receiverResults = await dynamoDbClient.send(receiverQueryCommand);

    const filteredSenderMessages = senderResults.Items.filter(
      item => item.receiverId.S == receiverId,
    );

    const filteredReceiverMessages = receiverResults.Items.filter(
      item => item.senderId.S == receiverId,
    );

    const combinedMessages = [
      ...filteredSenderMessages,
      ...filteredReceiverMessages,
    ]
      .map(item => ({
        messageId: item.messageId.S,
        senderId: item.senderId.S,
        receiverId: item.receiverId.S,
        message: item.message.S,
        timestamp: item.timestamp.S,
        type: item?.type?.S || 'text',
        audioUrl: item?.audioUrl?.S || null,
        imageUrl: item?.imageUrl?.S || null,
        deliveredAt: item?.deliveredAt?.S || null,
        readAt: item?.readAt?.S || null,
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.status(200).json(combinedMessages);
  } catch (error) {
    console.log('Error fetching messages', error);
  }
});

// Block a user (adds to blockedUsers of the actor). Emits socket to both.
app.post('/block', async (req, res) => {
  try {
    const { userId, blockedUserId } = req.body;
    if (!userId || !blockedUserId) {
      return res.status(400).json({ message: 'Missing userId or blockedUserId' });
    }
    const current = await docClient.send(new GetCommand({
      TableName: 'usercollection',
      Key: { userId },
      ProjectionExpression: 'blockedUsers',
    }));
    const list = current?.Item?.blockedUsers || [];
    const next = Array.from(new Set([ ...list, blockedUserId ].filter(Boolean)));
    await docClient.send(new UpdateCommand({
      TableName: 'usercollection',
      Key: { userId },
      UpdateExpression: 'SET blockedUsers = :list',
      ExpressionAttributeValues: { ':list': next },
    }));
    // Notify both parties via socket
    try {
      const actorSocketId = userSocketMap[userId];
      const targetSocketId = userSocketMap[blockedUserId];
      const payload = { actorId: userId, targetId: blockedUserId };
      if (actorSocketId) io.to(actorSocketId).emit('user:block', payload);
      if (targetSocketId) io.to(targetSocketId).emit('user:block', payload);
    } catch (e) {}
    return res.status(200).json({ message: 'User blocked' });
  } catch (error) {
    console.log('Block error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Unblock a user
app.delete('/block', async (req, res) => {
  try {
    const { userId, blockedUserId } = req.body;
    if (!userId || !blockedUserId) {
      return res.status(400).json({ message: 'Missing userId or blockedUserId' });
    }
    const current = await docClient.send(new GetCommand({
      TableName: 'usercollection',
      Key: { userId },
      ProjectionExpression: 'blockedUsers',
    }));
    const list = current?.Item?.blockedUsers || [];
    const next = list.filter(id => id !== blockedUserId);
    await docClient.send(new UpdateCommand({
      TableName: 'usercollection',
      Key: { userId },
      UpdateExpression: 'SET blockedUsers = :list',
      ExpressionAttributeValues: { ':list': next },
    }));
    // Notify actor (optional)
    try {
      const actorSocketId = userSocketMap[userId];
      const payload = { actorId: userId, targetId: blockedUserId };
      if (actorSocketId) io.to(actorSocketId).emit('user:unblock', payload);
    } catch (e) {}
    return res.status(200).json({ message: 'User unblocked' });
  } catch (error) {
    console.log('Unblock error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// List blocked users for a user (returns full profiles)
app.get('/blocked-users', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    const current = await docClient.send(new GetCommand({
      TableName: 'usercollection',
      Key: { userId },
      ProjectionExpression: 'blockedUsers',
    }));
    const list = current?.Item?.blockedUsers || [];
    // Ensure we only request valid, unique userIds
    const validIds = Array.from(new Set(list.filter(id => !!id)));
    if (!validIds.length) return res.status(200).json([]);
    const keys = validIds.map(id => ({ userId: id }));
    const batch = await docClient.send(new BatchGetCommand({
      RequestItems: {
        usercollection: {
          Keys: keys,
          // Fetch all attributes to avoid ProjectionExpression reserved word issues
        }
      }
    }));
    const items = batch?.Responses?.usercollection || [];
    return res.status(200).json(items);
  } catch (error) {
    console.log('Blocked users list error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Report a user (append to reported user's reports list)
app.post('/report', async (req, res) => {
  try {
    const { reporterId, reportedUserId, reason } = req.body;
    if (!reporterId || !reportedUserId) {
      return res.status(400).json({ message: 'Missing reporterId or reportedUserId' });
    }
    const reportItem = { reporterId, reason: reason || null, timestamp: new Date().toISOString() };
    const current = await docClient.send(new GetCommand({
      TableName: 'usercollection',
      Key: { userId: reportedUserId },
      ProjectionExpression: 'reports',
    }));
    const list = current?.Item?.reports || [];
    await docClient.send(new UpdateCommand({
      TableName: 'usercollection',
      Key: { userId: reportedUserId },
      UpdateExpression: 'SET reports = list_append(if_not_exists(reports, :empty), :new)',
      ExpressionAttributeValues: { ':empty': [], ':new': [reportItem] },
    }));
    return res.status(200).json({ message: 'Report submitted' });
  } catch (error) {
    console.log('Report error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// List users who have been reported (for admin panel)
app.get('/reported-users', async (req, res) => {
  try {
    const scanParams = {
      TableName: 'usercollection',
      ProjectionExpression: 'userId, firstName, email, reports, accountBlocked'
    };
    const result = await docClient.send(new ScanCommand(scanParams));
    const items = result?.Items || [];
    const reportedUsers = items
      .filter(u => Array.isArray(u.reports) && u.reports.length > 0)
      .map(u => ({
        userId: u.userId,
        firstName: u.firstName || null,
        email: u.email || null,
        reportCount: Array.isArray(u.reports) ? u.reports.length : 0,
        lastReportAt: Array.isArray(u.reports) && u.reports.length > 0 ? u.reports[u.reports.length - 1]?.timestamp || null : null,
        accountBlocked: !!u.accountBlocked,
      }));
    return res.status(200).json(reportedUsers);
  } catch (error) {
    console.log('Reported users fetch error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin dashboard stats
app.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    // Helper: build last N days series (inclusive of today)
    const buildDailySeries = (nDays, getDateTs, getValue) => {
      const series = [];
      const today = Date.now();
      for (let i = nDays - 1; i >= 0; i--) {
        const dayStart = new Date(today - i * 24 * 60 * 60 * 1000);
        const dayStr = dayStart.toISOString().slice(0, 10); // YYYY-MM-DD
        series.push({ date: dayStr, count: 0, value: 0 });
      }
      const indexByDate = Object.fromEntries(series.map((d, idx) => [d.date, idx]));
      const isSameDay = (tsStrIso, dayStr) => {
        if (!tsStrIso) return false;
        const d = new Date(tsStrIso);
        if (isNaN(d.getTime())) return false;
        return d.toISOString().slice(0, 10) === dayStr;
      };
      // Aggregate
      getDateTs.items.forEach((item) => {
        const ts = getDateTs.accessor(item);
        const val = getValue ? Number(getValue(item) || 0) : 0;
        // Find matching day bucket
        const dayIso = (() => {
          const d = new Date(ts);
          if (isNaN(d.getTime())) return null;
          return d.toISOString().slice(0, 10);
        })();
        if (!dayIso) return;
        const idx = indexByDate[dayIso];
        if (idx === undefined) return;
        series[idx].count += 1;
        series[idx].value += val;
      });
      return series;
    };

    const scanParams = {
      TableName: 'usercollection',
      // Fetch minimal fields needed for aggregation
      ProjectionExpression: 'userId, firstName, email, reports, accountBlocked'
    };
    const result = await docClient.send(new ScanCommand(scanParams));
    const items = result?.Items || [];
    const totalUsers = items.length;
    const blockedUsers = items.filter(u => !!u.accountBlocked).length;
    const activeUsers = totalUsers - blockedUsers;
    const reportedUsers = items.filter(u => Array.isArray(u.reports) && u.reports.length > 0);
    const reportedUsersCount = reportedUsers.length;
    const totalReports = reportedUsers.reduce((sum, u) => sum + (Array.isArray(u.reports) ? u.reports.length : 0), 0);
    const topReportedUsers = reportedUsers
      .map(u => ({
        userId: u.userId,
        firstName: u.firstName || null,
        email: u.email || null,
        reportCount: Array.isArray(u.reports) ? u.reports.length : 0,
        accountBlocked: !!u.accountBlocked,
      }))
      .sort((a, b) => b.reportCount - a.reportCount)
      .slice(0, 5);

    // Subscriptions summary
    let totalSubscriptions = 0;
    let activeSubscriptions = 0;
    let subscriptionsItems = [];
    try {
      const subs = await dynamoDbClient.send(new ScanCommand({ TableName: 'subscriptions' }));
      const subsItems = subs?.Items || [];
      // Using low-level client, map attributes
      totalSubscriptions = subsItems.length;
      // Consider case-insensitive status and endDate validity
      const todayTs = Date.now();
      activeSubscriptions = subsItems.filter(s => {
        const status = (s?.status?.S || s?.status || '').toLowerCase();
        const endIso = s?.endDate?.S || s?.endDate || null;
        const endTs = endIso ? Date.parse(endIso) : null;
        const notExpired = endTs ? endTs >= todayTs : true; // treat missing endDate as active
        return status === 'active' && notExpired;
      }).length;
      subscriptionsItems = subsItems.map(s => ({
        startDate: s?.startDate?.S || s?.startDate || null,
        status: s?.status?.S || s?.status || null,
        endDate: s?.endDate?.S || s?.endDate || null,
      }));
    } catch (e) {
      console.log('Subscriptions scan error', e?.message || e);
    }

    // Payments summary
    let totalPayments = 0;
    let totalRosesPurchased = 0;
    let paymentsItems = [];
    try {
      const pays = await docClient.send(new ScanCommand({ TableName: 'payments' }));
      const paysItems = pays?.Items || [];
      totalPayments = paysItems.length;
      totalRosesPurchased = paysItems.reduce((sum, p) => sum + Number(p?.rosesPurchased || 0), 0);
      paymentsItems = paysItems.map(p => ({
        createdAt: p?.createdAt || null,
        rosesPurchased: Number(p?.rosesPurchased || 0),
        status: p?.status || null,
      }));
    } catch (e) {
      console.log('Payments scan error', e?.message || e);
    }

    // Build 14-day trend series for charts
    const paymentsSeries = buildDailySeries(
      14,
      { items: paymentsItems, accessor: (i) => i.createdAt },
      (i) => i.rosesPurchased
    );
    const subscriptionsSeries = buildDailySeries(
      14,
      { items: subscriptionsItems, accessor: (i) => i.startDate },
      () => 0
    );

    return res.status(200).json({
      totalUsers,
      activeUsers,
      blockedUsers,
      reportedUsersCount,
      totalReports,
      topReportedUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalPayments,
      totalRosesPurchased,
      // New: 14-day series for charts
      paymentsSeries,
      subscriptionsSeries,
    });
  } catch (error) {
    console.log('Admin stats error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin payments list with optional filters: userId, start, end, status
app.get('/admin/payments', authenticateAdmin, async (req, res) => {
  try {
    const { userId, start, end, status } = req.query;
    const result = await docClient.send(new ScanCommand({ TableName: 'payments' }));
    let items = result?.Items || [];
    // Normalize and filter
    items = items.map(p => ({
      paymentId: p.paymentId,
      userId: p.userId,
      rosesPurchased: Number(p?.rosesPurchased || 0),
      status: p?.status || null,
      createdAt: p?.createdAt || null,
    }));
    if (userId) {
      items = items.filter(p => p.userId === userId);
    }
    if (status) {
      items = items.filter(p => (p.status || '').toLowerCase() === String(status).toLowerCase());
    }
    const startTs = start ? Date.parse(start) : null;
    const endTs = end ? Date.parse(end) : null;
    if (startTs) {
      items = items.filter(p => p.createdAt ? Date.parse(p.createdAt) >= startTs : false);
    }
    if (endTs) {
      items = items.filter(p => p.createdAt ? Date.parse(p.createdAt) <= endTs : false);
    }

    // Enrich with user firstName and email for better admin visibility
    try {
      const userIds = Array.from(new Set(items.map(i => i.userId).filter(Boolean)));
      if (userIds.length) {
        const batch = await docClient.send(new BatchGetCommand({
          RequestItems: {
            usercollection: {
              Keys: userIds.map(id => ({ userId: id })),
              ProjectionExpression: 'userId, firstName, email',
            }
          }
        }));
        const users = batch?.Responses?.usercollection || [];
        const userMap = {};
        users.forEach(u => { userMap[u.userId] = { firstName: u.firstName || null, email: u.email || null }; });
        items = items.map(i => ({ ...i, firstName: userMap[i.userId]?.firstName || null, email: userMap[i.userId]?.email || null }));
      }
    } catch (e) {
      console.log('Payments enrichment error', e?.message || e);
    }

    // Sort newest first
    items.sort((a, b) => (Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0)));
    const total = items.length;
    const totalRoses = items.reduce((sum, p) => sum + (Number(p.rosesPurchased) || 0), 0);
    return res.status(200).json({ total, totalRoses, items });
  } catch (error) {
    console.log('Admin payments fetch error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin subscriptions list with optional filters: userId, status, start, end
app.get('/admin/subscriptions', authenticateAdmin, async (req, res) => {
  try {
    const { userId, status, start, end } = req.query;
    const subs = await dynamoDbClient.send(new ScanCommand({ TableName: 'subscriptions' }));
    let items = subs?.Items || [];
    // Normalize from low-level client attribute format
    items = items.map(s => ({
      subscriptionId: s?.subscriptionId?.S || s?.subscriptionId,
      userId: s?.userId?.S || s?.userId,
      plan: s?.plan?.S || s?.plan,
      planName: s?.planName?.S || s?.planName,
      price: s?.price?.S || s?.price,
      startDate: s?.startDate?.S || s?.startDate,
      endDate: s?.endDate?.S || s?.endDate,
      status: s?.status?.S || s?.status,
    }));
    // Enrich with user name + email
    try {
      const userIds = Array.from(new Set(items.map(i => i.userId).filter(Boolean)));
      if (userIds.length) {
        const batch = await docClient.send(new BatchGetCommand({
          RequestItems: {
            usercollection: {
              Keys: userIds.map(id => ({ userId: id })),
              ProjectionExpression: 'userId, firstName, email',
            }
          }
        }));
        const users = batch?.Responses?.usercollection || [];
        const userMap = {};
        users.forEach(u => { userMap[u.userId] = { firstName: u.firstName || null, email: u.email || null }; });
        items = items.map(i => ({ ...i, firstName: userMap[i.userId]?.firstName || null, email: userMap[i.userId]?.email || null }));
      }
    } catch (e) {
      console.log('Subscriptions enrichment error', e?.message || e);
    }
    if (userId) items = items.filter(i => i.userId === userId);
    if (status) items = items.filter(i => (i.status || '').toLowerCase() === String(status).toLowerCase());
    const startTs = start ? Date.parse(start) : null;
    const endTs = end ? Date.parse(end) : null;
    if (startTs) items = items.filter(i => i.startDate ? Date.parse(i.startDate) >= startTs : false);
    if (endTs) items = items.filter(i => i.startDate ? Date.parse(i.startDate) <= endTs : false);
    // Sort by startDate desc
    items.sort((a, b) => (Date.parse(b.startDate || 0) - Date.parse(a.startDate || 0)));
    const total = items.length;
    const active = items.filter(i => i.status === 'active').length;
    return res.status(200).json({ total, active, items });
  } catch (error) {
    console.log('Admin subscriptions fetch error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Block a user's account (prevent login)
app.post('/admin/block-user', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    await docClient.send(new UpdateCommand({
      TableName: 'usercollection',
      Key: { userId },
      UpdateExpression: 'SET accountBlocked = :b, blockedAt = :ts',
      ExpressionAttributeValues: { ':b': true, ':ts': Date.now() },
    }));
    return res.status(200).json({ message: 'Account blocked' });
  } catch (error) {
    console.log('Admin block-user error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Unblock a user's account (allow login)
app.delete('/admin/block-user', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    await docClient.send(new UpdateCommand({
      TableName: 'usercollection',
      Key: { userId },
      UpdateExpression: 'SET accountBlocked = :b REMOVE blockedAt',
      ExpressionAttributeValues: { ':b': false },
    }));
    return res.status(200).json({ message: 'Account unblocked' });
  } catch (error) {
    console.log('Admin unblock-user error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark messages as read for a conversation (peerId -> userId)
app.post('/messages/mark-read', async (req, res) => {
  try {
    const { userId, peerId } = req.body;
    if (!userId || !peerId) {
      return res.status(400).json({ message: 'Missing userId or peerId' });
    }

    // Query messages sent by peerId to userId
    const receiverQueryParams = {
      TableName: 'messages',
      IndexName: 'receiverId-index',
      KeyConditionExpression: 'receiverId = :receiverId',
      ExpressionAttributeValues: {
        ':receiverId': { S: userId },
      },
    };
    const receiverResults = await dynamoDbClient.send(new QueryCommand(receiverQueryParams));
    const toMark = receiverResults.Items.filter(item => item.senderId.S === peerId && !item.readAt);

    const now = new Date().toISOString();
    const updatedIds = [];
    for (const item of toMark) {
      const mid = item.messageId.S;
      try {
        await dynamoDbClient.send(new UpdateItemCommand({
          TableName: 'messages',
          Key: { messageId: { S: mid } },
          UpdateExpression: 'SET readAt = :ts',
          ExpressionAttributeValues: { ':ts': { S: now } },
        }));
        updatedIds.push(mid);
      } catch (e) {
        console.log('Update readAt error', e?.message || e);
      }
    }

    // Notify sender if online
    const senderSocketId = userSocketMap[peerId];
    if (senderSocketId && updatedIds.length) {
      io.to(senderSocketId).emit('messages:read', { messageIds: updatedIds, by: userId });
    }

    return res.status(200).json({ updated: updatedIds.length });
  } catch (error) {
    console.log('Mark read error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Simple base64 image upload endpoint (optional helper)
app.post('/upload-image', async (req, res) => {
  try {
    const { imageBase64, ext = 'jpg' } = req.body || {};
    if (!imageBase64) return res.status(400).json({ message: 'Missing imageBase64' });
    const safeExt = ['jpg','jpeg','png','webp'].includes(String(ext).toLowerCase()) ? String(ext).toLowerCase() : 'jpg';
    const id = crypto.randomUUID();
    const filename = `${id}.${safeExt}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(imageBase64, 'base64');
    fs.writeFileSync(filePath, buffer);
    return res.status(200).json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.log('Upload image error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Store a device token for push notifications
app.post('/register-device-token', authenticateToken, async (req, res) => {
  try {
    const {userId, deviceToken} = req.body;
    if (!userId || !deviceToken) {
      return res.status(400).json({message: 'Missing userId or deviceToken'});
    }
    await docClient.send(
      new UpdateCommand({
        TableName: 'usercollection',
        Key: {userId},
        UpdateExpression: 'SET deviceToken = :t',
        ExpressionAttributeValues: {':t': deviceToken},
      }),
    );
    res.status(200).json({message: 'Device token registered'});
  } catch (error) {
    console.log('Error registering device token', error);
    res.status(500).json({message: 'Internal server error'});
  }
});

app.post('/subscribe', authenticateToken, async (req, res) => {
  const {userId, plan, type} = req.body;

  console.log('User', userId);
  console.log('plan', plan);
  console.log('type', type);

  if (!userId || !plan) {
    return res.status(400).json({message: 'Missing required fields'});
  }

  try {
    const startDate = new Date().toISOString();
    const duration =
      plan?.plan === '1 week'
        ? 7
        : plan?.plan === '1 month'
        ? 30
        : plan?.plan === '3 months'
        ? 90
        : 180;
    const endDate = dayjs(startDate).add(duration, 'day').toISOString();

    const paymentId = crypto.randomUUID();

    const params = {
      TableName: 'subscriptions',
      Item: {
        userId: {S: userId},
        subscriptionId: {S: paymentId},
        plan: {S: type},
        planName: {S: plan?.plan},
        price: {S: plan?.price},
        startDate: {S: startDate},
        endDate: {S: endDate},
        status: {S: 'active'},
      },
    };

    await dynamoDbClient.send(new PutItemCommand(params));

    const updateParams = {
      TableName: 'usercollection',
      Key: {userId},
      UpdateExpression:
        'SET subscriptions = list_append(if_not_exists(subscriptions, :empty_list), :new_subscription)',
      ExpressionAttributeValues: {
        ':new_subscription': [
          {
            subscriptionId: paymentId,
            planName: plan.plan,
            price: plan.price,
            plan: type,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
          },
        ],
        ':empty_list': [],
      },
      ReturnValues: 'UPDATED_NEW',
    };

    await docClient.send(new UpdateCommand(updateParams));

    res.status(200).json({message: 'Subscription saved successfully!'});
  } catch (error) {
    console.log('ERROR subscribing', error);
    return res.status(500).json({message: 'Internal server error'});
  }
});

app.post('/payment-success', async (req, res) => {
  try {
    const {userId, rosesToAdd} = req.body;

    const userParams = {
      TableName: 'usercollection',
      Key: {userId},
    };
    const userData = await docClient.send(new GetCommand(userParams));

    if (!userData.Item) {
      return res.status(404).json({message: 'User not found'});
    }

    const user = userData.Item;
    const roses = user.roses || 0;

    const newRoses = Number(roses) + Number(rosesToAdd);

    const updatedRoseParams = {
      TableName: 'usercollection',
      Key: {userId},
      UpdateExpression: 'SET roses = :newRoses',
      ExpressionAttributeValues: {
        ':newRoses': newRoses,
      },
    };

    await docClient.send(new UpdateCommand(updatedRoseParams));

    const paymentId = crypto.randomUUID();
    const paymentParams = {
      TableName: 'payments',
      Item: {
        paymentId: {S: paymentId},
        userId: {S: userId},
        // DynamoDB low-level client requires number values as string for N
        rosesPurchased: {N: String(rosesToAdd)},
        status: {S: 'success'},
        createdAt: {S: new Date().toISOString()},
      },
    };

    await dynamoDbClient.send(new PutItemCommand(paymentParams));

    return res
      .status(200)
      .json({message: 'Payment successful and roses updated', roses: newRoses});
  } catch (error) {
    console.log('Error', error);
    return res.status(500).json({message: 'Interval server error'});
  }
});

app.post('/send-rose', authenticateToken, async (req, res) => {
  const {userId, likedUserId, image, comment = null, type, prompt} = req.body;

  if (req.user.userId !== userId) {
    return res.status(403).json({message: 'Unauthorized action'});
  }

  if (!userId) {
    return res.status(400).json({message: 'Missing req parameters'});
  }

  try {
    const userParams = {
      TableName: 'usercollection',
      Key: {userId},
    };

    const userData = await docClient.send(new GetCommand(userParams));

    if (!userData.Item) {
      return res.status(404).json({message: 'User not found'});
    }

    const user = userData.Item;

    const rosesRemaining = user?.roses || 0;

    if (rosesRemaining <= 0) {
      return res.status(403).json({message: 'No roses remaining to send'});
    }

    const newRosesCount = rosesRemaining - 1;

    const decrementRosesParams = {
      TableName: 'usercollection',
      Key: {userId},
      UpdateExpression: 'SET roses = :newRoses',
      ExpressionAttributeValues: {
        ':newRoses': newRosesCount,
      },
    };

    const category = 'Rose';

    await docClient.send(new UpdateCommand(decrementRosesParams));

    let newLike = {userId, type, category};

    if (type === 'image') {
      if (!image) {
        return res
          .status(400)
          .json({message: 'Image URL is required for type "image"'});
      }
      newLike.image = image;
    } else if (type === 'prompt') {
      if (!prompt || !prompt.question || !prompt.answer) {
        return res.status(400).json({
          message: 'Prompt question and answer are required for type "prompt"',
        });
      }
      newLike.prompt = prompt;
    }

    if (comment) {
      newLike.comment = comment;
    }

    // Step 1: Update the liked user's 'receivedLikes' array
    const updateReceivedLikesParams = {
      TableName: 'usercollection',
      Key: {userId: likedUserId}, // Key for the liked user
      UpdateExpression:
        'SET receivedLikes = list_append(if_not_exists(receivedLikes, :empty_list), :newLike)',
      ExpressionAttributeValues: {
        ':newLike': [newLike],
        ':empty_list': [],
      },
      ReturnValues: 'UPDATED_NEW',
    };

    await docClient.send(new UpdateCommand(updateReceivedLikesParams));

    // Step 2: Update the current user's 'likedProfiles' array
    const updateLikedProfilesParams = {
      TableName: 'usercollection',
      Key: {userId}, // Key for the current user
      UpdateExpression:
        'SET likedProfiles = list_append(if_not_exists(likedProfiles, :empty_list), :likedUserId)',
      ExpressionAttributeValues: {
        ':likedUserId': [{likedUserId}],
        ':empty_list': [],
      },
      ReturnValues: 'UPDATED_NEW',
    };

    await docClient.send(new UpdateCommand(updateLikedProfilesParams));

    res.status(200).json({message: 'Rose sent successfully'});
  } catch (error) {
    console.log('Error', error);
    return res.status(500).json({message: 'Interval server error'});
  }
});

// Saved Openers: list/add/delete
app.get('/openers', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.userId;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });

    const userResp = await docClient.send(new GetCommand({ TableName: 'usercollection', Key: { userId }, ProjectionExpression: 'savedOpeners' }));
    const savedOpeners = userResp?.Item?.savedOpeners || [];
    return res.status(200).json({ savedOpeners });
  } catch (error) {
    console.log('Error listing openers', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/openers', authenticateToken, async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text || String(text).trim().length < 2) {
      return res.status(400).json({ message: 'Missing userId or text' });
    }
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    const opener = { openerId: crypto.randomUUID(), text: String(text).trim() };
    await docClient.send(new UpdateCommand({
      TableName: 'usercollection',
      Key: { userId },
      UpdateExpression: 'SET savedOpeners = list_append(if_not_exists(savedOpeners, :empty), :new)',
      ExpressionAttributeValues: {
        ':empty': [],
        ':new': [opener],
      },
      ReturnValues: 'UPDATED_NEW',
    }));
    return res.status(200).json({ opener });
  } catch (error) {
    console.log('Error adding opener', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/openers/:openerId', authenticateToken, async (req, res) => {
  try {
    const { openerId } = req.params;
    const userId = req.query.userId || req.user?.userId;
    if (!userId || !openerId) {
      return res.status(400).json({ message: 'Missing userId or openerId' });
    }
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    const userResp = await docClient.send(new GetCommand({ TableName: 'usercollection', Key: { userId }, ProjectionExpression: 'savedOpeners' }));
    const savedOpeners = userResp?.Item?.savedOpeners || [];
    const filtered = savedOpeners.filter(item => item?.openerId !== openerId);
    await docClient.send(new UpdateCommand({
      TableName: 'usercollection',
      Key: { userId },
      UpdateExpression: 'SET savedOpeners = :list',
      ExpressionAttributeValues: { ':list': filtered },
    }));
    return res.status(200).json({ deleted: openerId });
  } catch (error) {
    console.log('Error deleting opener', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Call logs: fetch user call history
app.get('/call-logs', authenticateToken, async (req, res) => {
  try {
    const authUserId = req.user?.userId;
    const userId = req.query?.userId || authUserId;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    if (!awsCredentials) return res.json({ logs: [] });
    const q = await docClient.send(new QueryCommand({
      TableName: CALL_LOGS_TABLE,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': String(userId) },
    }));
    const items = q?.Items || [];
    items.sort((a, b) => {
      const ta = a?.startTime || a?.createdAt || '';
      const tb = b?.startTime || b?.createdAt || '';
      return String(tb).localeCompare(String(ta));
    });
    res.json({ logs: items });
  } catch (e) {
    console.log('[call_logs] fetch error', e?.message || e);
    res.status(200).json({ logs: [] });
  }
});
// Load environment variables from .env (for local dev). Hosts like Render use dashboard envs.
dotenv.config();