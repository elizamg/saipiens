#!/usr/bin/env node
/**
 * Fetches fresh Cognito JWT tokens for test accounts.
 * Outputs JSON: { "student_token": "...", "student_sub": "...", "instructor_token": "...", "instructor_sub": "..." }
 */
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const poolData = { UserPoolId: 'us-west-1_pzs7P5vGg', ClientId: '34es28m8ocaom5rt55khms7p07' };
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

function getToken(email, password) {
  return new Promise((resolve, reject) => {
    const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({ Username: email, Password: password });
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken();
        resolve({ token: idToken.getJwtToken(), sub: idToken.decodePayload()['sub'] });
      },
      onFailure: (err) => reject(err)
    });
  });
}

Promise.all([
  getToken('dev-student@sapiens.dev', 'SapiensStudent#2026'),
  getToken('dev-instructor@sapiens.dev', 'SapiensInstructor#2026')
]).then(([student, instructor]) => {
  console.log(JSON.stringify({
    student_token: student.token,
    student_sub: student.sub,
    instructor_token: instructor.token,
    instructor_sub: instructor.sub,
  }));
}).catch(e => { console.error(e.message); process.exit(1); });
