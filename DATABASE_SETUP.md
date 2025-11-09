# DynamoDB Setup Instructions

## Required Tables and Indexes

### 1. usercollection Table
- **Partition Key**: `userId` (String)
- **Required GSI**: 
  - `email-index` with partition key `email` (String)

### 2. messages Table  
- **Partition Key**: `messageId` (String)
- **Required GSIs**:
  - `senderId-index` with partition key `senderId` (String)
  - `receiverId-index` with partition key `receiverId` (String)

### 3. subscriptions Table
- **Partition Key**: `subscriptionId` (String)

### 4. payments Table
- **Partition Key**: `paymentId` (String)

## AWS CLI Commands to Create GSIs

### For usercollection table:
```bash
aws dynamodb update-table \
    --table-name usercollection \
    --attribute-definitions AttributeName=email,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\":\"email-index\",\"KeySchema\":[{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}}]"
```

### For messages table:
```bash
# Create senderId-index
aws dynamodb update-table \
    --table-name messages \
    --attribute-definitions AttributeName=senderId,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\":\"senderId-index\",\"KeySchema\":[{\"AttributeName\":\"senderId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}}]"

# Create receiverId-index
aws dynamodb update-table \
    --table-name messages \
    --attribute-definitions AttributeName=receiverId,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\":\"receiverId-index\",\"KeySchema\":[{\"AttributeName\":\"receiverId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}}]"
```

## Troubleshooting

### Common Issues:
1. **"Could not load credentials"** - Ensure AWS credentials are properly configured
2. **Like button errors** - Verify GSIs are created and active
3. **Message loading issues** - Ensure both senderId-index and receiverId-index exist

### Verify GSI Status:
```bash
aws dynamodb describe-table --table-name usercollection
aws dynamodb describe-table --table-name messages
```

Look for "IndexStatus": "ACTIVE" in the response.