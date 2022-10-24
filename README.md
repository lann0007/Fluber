# Fluber

See the READMEs in `backend` and `frontend` for instructions on how to start the stack in dev or prod mode

## Environment variables

Make sure you define the `.env` file for the backend. For example:

```
HOST=0.0.0.0
PORT=1337
APP_KEYS="mHVoLNh2U5,WDqVWWM4sv"
API_TOKEN_SALT=NElw53Xh3qSLkn7YPlPBDj6NPhy4QmRB
ADMIN_JWT_SECRET=HEicYYCD5NlF7Zd7CXOAlFIJa5gmPazk
JWT_SECRET=UeUZF0td6L3hj4X04RIhP7PKbM363FDC
```

Frontend's `.env` might look something like:

```
CORE_API_BASE_URL = 'http://localhost:1337'
WEBSOCKET_SERVER_BASE_URL = 'http://localhost:3000'
```

The Express Server's `.env` might look something like:

```
CORE_API_BASE_URL = 'http://localhost:1337'
```

## Navigator unsecure origins

To use the app from a mobile device, we need to allow unsecure origins for the location services to work. To do so, enable the flag with the IP address/port of the webapp instance you're trying to access according to [this](https://stackoverflow.com/a/58664780) thread.