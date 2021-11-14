import express = require('express');
import serveIndex = require('serve-index');
import session = require('express-session');
import {sso, sspi, UserCredential, AcceptSecurityContextInput} from 'F:/Apps/ng/angular-sso-example/back/lib/node-expose-sspi/src/index';
const { impersonateLoggedOnUser,  revertToSelf, logonUser} = require('F:\\Apps\\ng\\angular-sso-example\\back\\build\\Release\\users.node');
import cors from 'cors';
import os = require('os');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const MAX_BUFFER_SIZE = 2000 * 1024;
const app = express();

app.use((req, res, next) => {
  console.log('req.url', req.url);
  console.log('origin', req.headers.origin);
  next();
});

app.use(
  cors((req, callback) => {
  console.log('request host: ',req.headers.host);
    const options = {
      credentials: true,
        origin: [
            'http://' + req.headers.host?.replace(':3500', ':4200') ?? '',
            'http://' + req.headers.host?.replace(':3500', '') ?? '',
        ],
    };
    callback(null, options);
  })
);

app.use(express.json());
app.use(
  session({
    secret: 'this is my super secreeeeeet!!!!!',
    resave: false,
    saveUninitialized: true,
  })
);

app.use('/mysso/ws/protected', sso.auth(),  (req, res, next) => {
  if (!((req.session as any)?.sso) || !req.headers.authorization) {
    return res.status(401).end();
  }
  next();
});

const getUserName = (req : any) => req?.session?.sso?.user?.name?.toLowerCase();

const getAccessToken = (req : any) => req?.session?.sso?.user?.accessToken;
const getServerHandle = (req : any) => req?.session?.sso?.user?.serverContextHandle

const isAuthorized = (username:string) => true; //['en21165'].includes(username);

const DBLayer = require('f://Apps/node/sqliteapp/connect');

app.use('/mysso/ws/protected/secret', (req, res) => {
  const username = getUserName(req);
  const accessToken = getAccessToken(req);
  //const serverContextHandle = getServerHandle(req);
  //console.log('srv handle %o', serverContextHandle);
  //res.json({hello: username});
  if (isAuthorized(username)) {
  console.log('accessToken %o', accessToken);
  /*
  const logonToken = logonUser(
  'en21165',
  '****',
  'eninet',
  4,
  0
);
  console.log('logonToken %o', logonToken);
  */
  //const handle_str = 


	const packageName = 'Negotiate';
  let { credential, tsExpiry } = sspi.AcquireCredentialsHandle({
    packageName,
  });
  console.log('credential %o', credential);
    const checkCredentials = (): void => {
    if (tsExpiry < new Date()) {
      // renew server credentials
      sspi.FreeCredentialsHandle(credential);
      const renewed = sspi.AcquireCredentialsHandle({
        packageName,
      });
      credential = renewed.credential;
      tsExpiry = renewed.tsExpiry;
    }
  };
  checkCredentials();
  console.log('checked credential %o', credential);
  
	const authorization = req.headers.authorization;
	//console.log('authorization', authorization);
	const token = authorization!.substring(
          ('Negotiate' + ' ').length
        );
	//console.log('token %o', token);
	const buffer = sso.decode(token);
	//console.log('buffer', buffer);


  

	
  try {
	//impersonateLoggedOnUser(accessToken);
	const schManager = new sso.ServerContextHandleManager();
	//schManager.release(req);
	let serverContextHandle = getServerHandle(req); 
	console.log('old serverContextHandle %o', serverContextHandle);
	//let serverContextHandle = schManager.get(req);
	
		const input: AcceptSecurityContextInput = {
          credential,
          SecBufferDesc: {
            ulVersion: 0,
            buffers: [buffer],
          },
        };
	
	console.log('serverContextHandle %o', serverContextHandle);
	if (serverContextHandle) {
          console.log('adding to input a serverContextHandle (not first exchange)');
          input.contextHandle = serverContextHandle;
        } 
	
	
	//const serverSecurityContext = sspi.AcceptSecurityContext(input);
	//console.log('serverSecurityContext %o', serverSecurityContext);
	//serverContextHandle = serverSecurityContext.contextHandle;
	//console.log('last serverContextHandle %o', serverContextHandle);
	
	//input.contextHandle = serverContextHandle;
	
	
	if (serverContextHandle) {
	//schManager.set(req, serverContextHandle);
	//sspi.ImpersonateSecurityContext(serverContextHandle);
	const new_access_token = sspi.OpenThreadToken();
	impersonateLoggedOnUser(new_access_token);
<<<<<<< HEAD
	// TEST 1 impersonateLoggedOnUser : 'Access is denied.'
=======
>>>>>>> 157f03c53a0f5ac38ff8cb69210f6a6fe8f378e1
	sspi.RevertSecurityContext(serverContextHandle);
	sspi.CloseHandle(new_access_token);
	
	}
  }
  catch(error:any) {
		  console.error('impersonateLoggedOnUser :%o', error.message);
		  //res.json({error: error.message});
		  // try DBLayer anyway
		}
  console.log('impersonateLoggedOnUser done %o', os.userInfo()); // %o', handle_str);
  const callback =  (ret:any) => 
	{
		console.log('revertToSelf');
		revertToSelf();
		console.log('return json');
		return res.json(ret);
	}
  const db = DBLayer.sqlite_connect(callback);
<<<<<<< HEAD
  // TEST 2 sqlite connection: 'SQLITE_CANTOPEN: unable to open database file'
=======
  /* accesss is denied
  https://stackoverflow.com/questions/60205712/access-denied-in-windows-cmd-but-working-in-powershell
  const path = String.raw`\\ENNf2001.eni.pri\oper\RUBEIS\LONG TERM CHARTERING\05. APPLICATIVO SCORING MODEL SHIP TENDER\DB\bid.s3db`;
  try {
    const test = fs.existsSync(path); 
	res.json({hello: username, path_found: test});
  }
  catch(error:any) {
		  console.log('fs.existsSync :%o', error);
		  res.json({hello: username, path_found: 'error'});
		}*/
>>>>>>> 157f03c53a0f5ac38ff8cb69210f6a6fe8f378e1
  
  } else {
	res.json({hello: username, authorized: false});
  }
});

app.use('/mysso/ws/myhost',(req, res) => {
  console.log('request: ',req);
  return res.json({http_host: 'http://' + req.headers.host?.replace(':3500',':4200')??'', machine_host: os.hostname()})
});

app.get('/mysso/ws/connect-with-sso', sso.auth(), (req, res) => {
  console.log('sso method',(req.session as any).method);
  if (!((req as any).sso)) {
    return res.status(401).end();
  }
  if (req.session) {
    (req.session as any).sso = (req as any).sso;
  }
  return res.json({
    sso: (req as any).sso,
  });
});

app.post('/mysso/ws/connect', async (req, res) => {
  console.log('connect login', req.body.login);
  var reqdomain = sso.getDefaultDomain();
  var requser = req.body.login;
  const domainsplit = req.body.login.split('\\');
  if (domainsplit.length > 1) {
	  requser = domainsplit[domainsplit.length - 1];
	  reqdomain = domainsplit[0];
  }
  console.log('req domain: ', reqdomain, 'req user:', requser);

  const credentials : UserCredential = {
    domain: reqdomain,
    user: requser,
    password: req.body.password,
  };
  // console.log('credentials: ', credentials);
  const ssoObject = await sso.connect(credentials);
  //console.log('ssoObject: ', ssoObject);
  if (ssoObject && req.session) {
    (req.session as any).sso = ssoObject;
    return res.json({
      sso: (req.session as any)?.sso,
    });
  }
  return res.status(401).json({
    error: 'bad login/password.',
  });
});

app.get('/mysso/ws/disconnect', (req, res) => {
  if (req.session) {
    delete (req.session as any).sso;
  }
  return res.json({});
});

app.get('/mysso/ws/is-connected', (req, res) => {
  if ((req.session as any).sso) {
    return res.json({sso: (req.session as any).sso});
  }
  return res.status(401).end();
});

const www = '../../../front/dist/front';
app.use(express.static(www));
//app.use(serveIndex(www, {icons: true}));

// We need to get the port that IISNode passes into us 
// using the PORT environment variable, if it isn't set use a default value
const port = process.env.PORT || 3500;

app.listen(port, () => console.log('Server started on port ' + port));

console.log('user info', os.userInfo());



