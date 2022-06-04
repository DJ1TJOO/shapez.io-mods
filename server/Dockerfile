FROM node:16-alpine

# Create app directory
WORKDIR /app
COPY . .

# Use yarn to restore packages
RUN yarn install --production

EXPOSE 8888
CMD [ "yarn", "start" ]