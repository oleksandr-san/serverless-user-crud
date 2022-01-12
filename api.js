const AWS = require('aws-sdk');

const api = {};

const TABLE_NAME = process.env.TABLE_NAME;

api.handler = async event => {
  console.log('event', event);
  console.log('TABLE_NAME', TABLE_NAME);
  let response = {};
  
  try {
    if (event.path.includes('users')) {
      if (event.httpMethod === 'POST') {
        // save user in DynamoDB
        response.body = JSON.stringify(await api.handleCreateUser(JSON.parse(event.body)));
        response.statusCode = 200;

      } else if (event.httpMethod === 'GET') {
        if (event.pathParameters && event.pathParameters.id) {
          let userId = event.pathParameters.id;
          response.body = JSON.stringify(await api.handleGetUserById(userId));
        } else {
          response.body = JSON.stringify(await api.handleGetUsers());
        }
        response.statusCode = 200;
      } else if (event.httpMethod === 'DELETE' && event.pathParameters && event.pathParameters.id) {
        let userId = event.pathParameters.id;
        response.body = JSON.stringify(await api.handleDeleteUserById(userId));
        response.statusCode = 200;
      } else if (event.httpMethod === 'PUT' && event.pathParameters && event.pathParameters.id) {
        let userId = event.pathParameters.id;
        response.body = JSON.stringify(await api.handleUpdateUserById(userId, JSON.parse(event.body)));
        response.statusCode = 200;
      } else {
        response.statusCode = 404;
      }
    } else {
      response.statusCode = 404;
    }
  } catch (e) {
    response.body = JSON.stringify(e);
    response.statusCode = 500;
  }

  console.log('response', response);
  return response;
};

api.handleCreateUser = item => {
  return new Promise((resolve, reject) => {
    let documentClient = new AWS.DynamoDB.DocumentClient();

    let params = {
      TableName: TABLE_NAME,
      Item: item
    };

    console.log('DB put', params);
    documentClient.put(params, (err, data) => {
      if(err) reject(err);
      else resolve(data);
    });
  });
};

api.handleGetUsers = () => {
  return new Promise((resolve, reject) => {
    let documentClient = new AWS.DynamoDB.DocumentClient();

    let params = {
      TableName: TABLE_NAME
    };

    documentClient.scan(params, (err, data) => {
      if(err) reject(err);
      else resolve(data);
    });
  });
};

api.handleGetUserById = userId => {
  return new Promise((resolve, reject) => {
    let documentClient = new AWS.DynamoDB.DocumentClient();

    let params = {
      TableName: TABLE_NAME,
      Key: {
        UserId: userId
      }
    };

    documentClient.get(params, (err, data) => {
      if(err) reject(err);
      else resolve(data);
    });
  });
};

api.handleUpdateUserById = (userId, user) => {
  return new Promise((resolve, reject) => {
    let documentClient = new AWS.DynamoDB.DocumentClient();
    
    let params = {
      TableName: TABLE_NAME,
      Key: {
        UserId: userId,
      },
      UpdateExpression: "set #n = :n, #j = :j",
      ExpressionAttributeNames: {
        "#n": "Name",
        "#j": "Job"
      },
      ExpressionAttributeValues: {
        ":n": user.name,
        ":j": user.job
      },
      ReturnValues: "UPDATED_NEW",
    };
    
    documentClient.update(params, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

api.handleDeleteUserById = userId => {
  return new Promise((resolve, reject) => {
    let documentClient = new AWS.DynamoDB.DocumentClient();

    let params = {
      TableName: TABLE_NAME,
      Key: {
        UserId: userId
      }
    };

    documentClient.delete(params, (err, data) => {
      if(err) reject(err);
      else resolve(data);
    });
  });
};

module.exports = api;