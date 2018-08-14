const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// Important: If modifying these scopes, delete credentials.json.  Also, you may need to delete token.json and follow instructions in terminal.
// const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.compose', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/calendar' ];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  // authorize(JSON.parse(content), listLabels);
  authorize(JSON.parse(content), listEvents);
  // authorize(JSON.parse(content), createEvent);
  // authorize(JSON.parse(content), sendEmail);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 't8rpargqt4m674v1afsv0riqug@group.calendar.google.com',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}

function sendEmail(auth) {
  const gmail = google.gmail({version: 'v1', auth});

  const email = {
    raw: "RnJvbTogRGF2aWQgVmV6emFuaSA8ZGN2ZXp6YW5pQGdtYWlsLmNvbT4NClRvOiBEYXZlIFYgPGRhdmVAcmVsaWFjb2RlLmNvbT4NClN1YmplY3Q6IFNheWluZyBIZWxsbw0KRGF0ZTogU3VuLCAyOSBKdWwgMjAxOCAwNzoxNTowMCAtMDcwMA0KTWVzc2FnZS1JRDogPDEyMzRAbG9jYWwubWFjaGluZS5leGFtcGxlPg0KDQpUaGlzIGlzIGEgbWVzc2FnZSBqdXN0IHRvIHNheSBoZWxsby4gU28sIEhlbGxvLg0K",
  };

  gmail.users.messages.send({
    userId: 'me',
    resource: email, 
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(res);
  });
}

function createEvent(auth) {
  const calendar = google.calendar({version: 'v3', auth});

  const event = {
    summary: 'this is a test',
    // location: '800 Howard St., San Francisco, CA 94103',
    description: "this is a test description",
    start: {
      // date: '2018-07-28',
      dateTime: '2018-08-04T09:00:00-07:00',
      timeZone: 'America/Denver', 
    },
    end: {
      // date: '2018-07-28',
      dateTime: '2018-08-04T09:30:00-07:00',
      timeZone: 'America/Denver', 
    },
    // recurrence: ['RRULE:FREQ=DAILY;COUNT=2'],
    // attendees: [{ email: 'lpage@example.com' }, { email: 'sbrin@example.com' }],
    attendees: [{ email: 'dcvezzani@gmail.com' }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 12 * 60 },
        { method: 'popup', minutes: 30 }
      ]
    }
  };

  calendar.events.insert({
    calendarId: 't8rpargqt4m674v1afsv0riqug@group.calendar.google.com',
    resource: event, 
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(res);
  });
}

