# YouTube Backend using Node.js, Express.js, MongoDB, and Cloudinary

Welcome to the backend code repository for a YouTube-like platform built with Node.js and Express.js. This application utilizes MongoDB for data storage and Cloudinary for image uploading. It offers various functionalities such as user authentication, video uploading, liking, subscribing, commenting, and more.

## Features

- **User Authentication**: Secure user authentication system using JWT tokens.
- **Video Uploads**: Ability for users to upload videos to the platform.
- **Like and Subscribe**: Users can like and subscribe to channels.
- **Commenting System**: Enable users to comment on videos.
- **Cloudinary Integration**: Seamless integration with Cloudinary for efficient image uploading and management.
- **RESTful API**: Well-structured RESTful endpoints for smooth communication with the frontend.

## Tech Stack

- **Node.js**: Server-side JavaScript runtime environment.
- **Express.js**: Minimal and flexible Node.js web application framework.
- **MongoDB**: Scalable NoSQL database for storing application data.
- **Cloudinary**: Cloud-based image and video management solution.

## Setup Instructions

1. **Clone the Repository**: 
    ```
    git clone https://github.com/your_username/your_repository.git
    ```

2. **Install Dependencies**: 
    ```
    npm install
    ```

3. **MongoDB Setup**: 
    - Sign up for an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
    - Create a new cluster and follow the instructions to set up a new database.
    - Obtain your MongoDB connection string and add it to the `MONGO_URL` variable in your `.env` file.

4. **Cloudinary Setup**:
    1. **Sign up for Cloudinary**: Register at [Cloudinary](https://cloudinary.com/).
    2. **Retrieve Credentials**: Get your Cloud Name, API Key, and API Secret from your Cloudinary dashboard.
    3. **Install Cloudinary SDK**: 
        ```
        npm install cloudinary
        ```
    4. **Set Environment Variables**: 
        ```
        CLOUDINARY_CLOUD_NAME=your_cloud_name
        CLOUDINARY_API_KEY=your_api_key
        CLOUDINARY_API_SECRET=your_api_secret
        ```

5. **JWT Configuration**:
    - Generate secure JWT secret keys and expiry times for access and refresh tokens.
        ```
        ACCESS_TOKEN_SECRET=your_access_token_secret
        ACCESS_TOKEN_EXPIRY=your_access_token_expiry

        REFRESH_TOKEN_SECRET=your_refresh_token_secret
        REFRESH_TOKEN_EXPIRY=your_refresh_token_expiry
        ```

6. **Configure Environment Variables**.
7. **Run the Server**: 
    ```
    npm run dev
    ```