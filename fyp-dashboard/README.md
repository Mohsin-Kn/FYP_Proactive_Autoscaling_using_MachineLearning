[git@github.com](mailto:git@github.com)\:Mohsin-Kn/FYP\_Proactive\_Autoscaling\_using\_MachineLearning.git

# Kubernetes Dashboard

A React-based web application for monitoring and managing Kubernetes resources.

## Features

* Secure Admin Authentication
* Pod Management
* History Tracking
* Settings Configuration
* Responsive Dashboard Interface

## Getting Started

### Prerequisites

* Node.js (v14 or higher)
* npm (v6 or higher)
* Python 3.7+ (for backend)
* Uvicorn

## Installation & Run

1. **Clone the repository**

   ```bash
   git clone git@github.com:Mohsin-Kn/FYP_Proactive_Autoscaling_using_MachineLearning.git
   ```
2. **Frontend setup**

   ```bash
   cd fyp-dashboard/frontend
   npm install
   npm start
   ```
3. **Backend setup**

   ```bash
   cd ../backend
   uvicorn main:app --reload
   ```

## Built With

* React.js
* React Router
* Bootstrap
* FastAPI
* Uvicorn
* Local Storage for Authentication

## License

This project is licensed under the MIT License
