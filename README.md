### Authentication Microservice for Dental Platform

This is the authentication service for my **marketplace platform** in the dental and medical domain. It was developed as part of a private project and handles user authentication through **phone OTP** verification. Additionally, it integrates with a **notification service** to manage OTP and email-based notifications.

### Features
- **Phone OTP Authentication**: Users sign in using a one-time password sent to their phone.
- **RabbitMQ Messaging**: Manages internal communication between **8 microservices**.
- **Flexible Authentication**: Can be modified to support **username/password** authentication instead of phone OTP.
- **Integration with Notification Service**: Handles OTP and email notifications via a separate microservice.
- **Scalable & Secure**: Designed for a distributed microservices architecture.

### Technologies Used
- **Node.js** (Express.js)
- **MongoDB** (User database)
- **RabbitMQ** (Microservice communication)
- **Docker** (Containerized deployment)
- **Redis** (Session management)
- **Elasticsearch** (Search and logging)

### Modifications
If you prefer **username/password authentication**, you can modify the service by:
- Updating the **database schema** to store hashed passwords.
- Adding a **password-based login endpoint**.
- Using **bcrypt** for password hashing.

### License
This project is open-source and available for modification based on your project needs.

### Contributing
If you’d like to contribute or report issues, feel free to submit a pull request or open an issue.

---
**Author:** [Hamze Lotfalinezhad](https://github.com/hamzelotfalinezhad)
