import express = require('express');
import serveIndex = require('serve-index');
import session = require('express-session');
import {sso, sspi, UserCredential, AcceptSecurityContextInput} from 'F:/Apps/ng/angular-sso-example/back/lib/node-expose-sspi/src/index';
const { impersonateLoggedOnUser, impersonateLoggedOnUserSSPI, revertToSelf, logonUser} = require('F:\\Apps\\ng\\angular-sso-example\\back\\build\\Release\\users.node');
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

app.use('/mysso/ws/logonUser', async (req, res, next) => {
try{
	console.log('userInfo now %o', os.userInfo()); 
	// it shows the process_owner that is different from myuser
	

	fs.writeFile('helloworld.txt', 'Hello World!', function (err: any) {
	  if (err) 
		{
			console.error('%s', err.message);
			// res.json({ error: err.message});
			return;
		}
	  console.log('Hello World > helloworld.txt');
	  // res.json({ file: 'written'});
	});
	
  const callback =  (ret:any) => 
	{
		console.log('return json');
		return res.json(ret);
	}
  // sqlite test	
  const db = DBLayer.sqlite_connect(callback);
  // TEST 2 sqlite connection: 'SQLITE_CANTOPEN: unable to open database file'
  // ms sql test
  // const db = await DBLayer.mssql_connect(callback);
	
	
    // revertToSelf();	
	// console.log('userInfo now %o ticket %o', os.userInfo(), logon_ticket); 
	// problem: it still shows the process owner that is different from myuser! 
	 // res.json({test:'OK?', userInfo:os.userInfo()});
	 return;
} catch (err: any) {
	console.error('logon err', err);
	res.json({ error: err.message});
}

});

app.use('/mysso/ws/protected', (req, res, next) => {
  if (!((req.session as any)?.sso) ) {
    return res.status(401).end();
  }
  next();
});

const getUserName = (req : any) => req?.session?.sso?.user?.name?.toLowerCase();

const getAccessToken = (req : any) => req?.session?.sso?.user?.accessToken;
const getServerHandle = (req : any) => req?.session?.sso?.user?.serverContextHandle

const isAuthorized = (username:string) => true; 

const DBLayer = require('f://Apps/node/sqliteapp/connect');

app.use('/mysso/ws/protected/secret', async (req, res) => {
	try {
	  const username = getUserName(req);
	  const accessToken = getAccessToken(req);
	  const serverHandle = getServerHandle(req);

	  if (isAuthorized(username)) {
	  console.log('serverHandle %o accessToken %o username %s', serverHandle, accessToken, username);
	  sspi.ImpersonateSecurityContext(serverHandle);
	  const testImpersonate = impersonateLoggedOnUserSSPI();
	  console.log('testImpersonate %s', testImpersonate);
	  var ret1: any;
	  const callback2 =  (ret:any) => 
		{
			console.log('revertToSelf');
			revertToSelf();
			sspi.RevertSecurityContext(serverHandle);
			console.log('return json');
			return res.json({ret2: ret, ret1: ret1});
		}
	  const callback1 =  (ret:any) => 
		{
			console.log('callback1 1');
			ret1 = ret;
			  // ms sql test
		  // sqlite test	
		  const db1 = DBLayer.sqlite_connect(callback2);
		  // TEST 2 sqlite connection: 'SQLITE_CANTOPEN: unable to open database file'

			
		}	
		const db2 = await DBLayer.mssql_connect(callback1);
		//TEST 3 ms sql windows auth fails: [Microsoft][SQL Server Native Client 11.0][SQL Server]Login failed for user 'domain\\owner'."  
	  } else {
		res.json({hello: username, authorized: false});
	  }
  } catch (err: any) {
	console.error('ImpersonateSecurityContext err', err);
	res.json({
		error: err.message,
	  });
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
  try {
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
	  console.log('ssoObject: ', ssoObject);
	  if (ssoObject && req.session) {
		(req.session as any).sso = ssoObject;
		return res.json({
		  sso: (req.session as any)?.sso,
		});
	  }
	  return res.status(401).json({
		error: 'bad login/password.',
	  });
  } catch (err: any) {
	console.error('connect err', err);
	return res.status(401).json({
		error: err.message,
	  });
}
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



