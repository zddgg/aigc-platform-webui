pipeline {
    agent any

    environment {
        IMAGE_NAME = "aigc-platform-webui"
        IMAGE_TAG = "1.0.0"
        CONTAINER_NAME = "aigc-platform-webui"
    }

    tools {
        nodejs "nodejs-20.15.0"
    }

    stages {
//         stage('Install Dependencies') {
//             steps {
//                 script {
//                     sh 'npm install -g pnpm'
//                     sh 'pnpm install'
//                 }
//             }
//         }

        stage('Build Docs') {
            steps {
                script {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build . -t ${IMAGE_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage('Stop and Remove Previous Container') {
            steps {
                script {
                    sh """
                    if [ \$(docker ps -q -f name=${CONTAINER_NAME}) ]; then
                        docker stop ${CONTAINER_NAME}
                    fi
                    if [ \$(docker ps -aq -f name=${CONTAINER_NAME}) ]; then
                        docker rm ${CONTAINER_NAME}
                    fi
                    """
                }
            }
        }

        stage('Run New Container') {
            steps {
                script {
                    sh """
                    docker run -d --name ${CONTAINER_NAME} --network app -p 10332:80 ${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Deployment finished'
        }
    }
}
