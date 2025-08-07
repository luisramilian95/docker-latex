FROM ubuntu:24.04
# Updating the repository and installing Node.js and npm
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y nodejs npm
# Installing LATEX
RUN apt install texlive-full -y
# Installing additional LaTeX packages
RUN apt install texlive-fonts-recommended texlive-fonts-extra texlive-lang-all -y


# Setting up the working directory and copying application files
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# Exposing the application port and starting the server
EXPOSE 3000

CMD [ "node", "server.js" ]