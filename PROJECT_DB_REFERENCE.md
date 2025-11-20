# Project Database Reference (Table Structure)

Below are compact table structures with column name, datatype, constraint, and a two‑word description for quick reporting.

## usercollection

| Column Name     | Datatype        | Constraint        | Description      |
|-----------------|-----------------|-------------------|------------------|
| userId          | String          | PK, Required      | User identifier  |
| email           | String          | Required, GSI     | Email address    |
| firstName       | String          | Required          | First name       |
| lastName        | String          | Optional          | Last name        |
| password        | String          | Required          | Password hash    |
| gender          | String          | Required          | User gender      |
| dateOfBirth     | String          | Required          | Birth date       |
| type            | String          | Optional          | Account type     |
| location        | String          | Optional          | User location    |
| hometown        | String          | Optional          | Home town        |
| workPlace       | String          | Optional          | Workplace name   |
| jobTitle        | String          | Optional          | Job title        |
| imageUrls       | List<String>    | Required          | Profile images   |
| prompts         | List<Map>       | Optional          | Prompt list      |
| likes           | Number          | Optional          | Like credits     |
| roses           | Number          | Optional          | Rose credits     |
| likedProfiles   | List<Map>       | Optional          | Liked users      |
| receivedLikes   | List<Map>       | Optional          | Inbound likes    |
| matches         | List<String>    | Optional          | Matched users    |
| blockedUsers    | List<String>    | Optional          | Blocked users    |
| accountBlocked  | Boolean         | Optional          | Account blocked  |
| blockedAt       | Number          | Optional          | Blocked time     |
| streakCount     | Number          | Optional          | Activity streak  |
| lastActiveAt    | String          | Optional          | Last activity    |
| deviceToken     | String          | Optional          | Push token       |
| subscriptions   | List<Map>       | Optional          | User plans       |
| savedOpeners    | List<Map>       | Optional          | Saved openers    |
| reports         | List<Map>       | Optional          | User reports     |

Indexes
- `email-index` (HASH: `email`)

## messages

| Column Name   | Datatype     | Constraint        | Description    |
|---------------|--------------|-------------------|----------------|
| messageId     | String       | PK, Required      | Message id     |
| senderId      | String       | Required, GSI     | Sender user    |
| receiverId    | String       | Required, GSI     | Receiver user  |
| message       | String       | Required          | Message text   |
| timestamp     | String       | Required          | Sent time      |
| type          | String       | Optional          | Message type   |
| audioUrl      | String       | Optional          | Audio url      |
| imageUrl      | String       | Optional          | Image url      |
| deliveredAt   | String       | Optional          | Delivered time |
| readAt        | String       | Optional          | Read time      |

Indexes
- `senderId-index` (HASH: `senderId`)
- `receiverId-index` (HASH: `receiverId`)

## subscriptions

| Column Name     | Datatype | Constraint   | Description    |
|-----------------|----------|--------------|----------------|
| subscriptionId  | String   | PK, Required | Subscription id|
| userId          | String   | Required     | User id        |
| plan            | String   | Required     | Plan code      |
| planName        | String   | Required     | Plan name      |
| price           | String   | Required     | Plan price     |
| startDate       | String   | Required     | Start date     |
| endDate         | String   | Required     | End date       |
| status          | String   | Required     | Plan status    |

## payments

| Column Name   | Datatype | Constraint   | Description     |
|---------------|----------|--------------|-----------------|
| paymentId     | String   | PK, Required | Payment id      |
| userId        | String   | Required     | User id         |
| rosesPurchased| Number   | Required     | Roses count     |
| status        | String   | Required     | Payment status  |
| createdAt     | String   | Required     | Created time    |

## admins

| Column Name   | Datatype | Constraint   | Description     |
|---------------|----------|--------------|-----------------|
| adminId       | String   | PK, Required | Admin id        |
| email         | String   | Required     | Email address   |
| passwordHash  | String   | Required     | Password hash   |
| createdAt     | Number   | Required     | Created time    |

## user_activity

| Column Name   | Datatype | Constraint   | Description    |
|---------------|----------|--------------|----------------|
| userId        | String   | PK, Required | User id        |
| activityDate  | String   | SK, Required | Activity date  |

Notes
- Datetime fields are ISO strings; numbers like `rosesPurchased` are numeric.
- Constraints reflect observed usage; GSIs are listed under “Indexes”.

## Programming Environments

Backend
- Node.js + `express@4.x` for REST API endpoints.
- Real-time signaling: `socket.io@4.x`.
- AWS SDK v3: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-cognito-identity-provider`.
- Config via `.env` (AWS region, credentials, app settings).
- File uploads directory: `api/uploads/`.

Frontend
- Admin Web: `React` + `Vite` (`admin/`), styles with `Tailwind CSS` + `PostCSS`.
- Mobile App: `React Native 0.76.x` with Metro bundler.
- Mobile libraries: `@react-native-async-storage/async-storage`, `@react-native-community/geolocation`, `react-native-vector-icons`, `@zegocloud/zego-uikit-prebuilt-call-rn` (voice/video calls).

Database
- Primary datastore: `Amazon DynamoDB`.
- Tables: `usercollection`, `messages`, `subscriptions`, `payments`, `admins`, `user_activity`.
- Indexes: see table sections above and `DATABASE_SETUP.md`.

DevOps
- Package managers: `npm` and `yarn`.
- Android build: `./gradlew assembleRelease` → `android/app/build/outputs/apk/release/app-release.apk`.
- iOS project managed with CocoaPods/Xcode (`ios/Podfile`, workspace/project files).
- Quality: ESLint (`.eslintrc.js`), Prettier (`.prettierrc.js`), Jest (`jest.config.js`, `__tests__/`).
- Tooling configs: `babel.config.js`, `metro.config.js`.