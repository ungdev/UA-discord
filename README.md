# UTT Arena Discord Bot Backup

## General Information
This is a script that manages the UTT Arena bot to reset the public Discord server for the competition between two editions.
It also create a backup file.

## Setup
To run this project:
1. Install dependencies.
```
npm install
```
2. Create and complete the .env file with the contents from [.env.example](.env.example).
3. Run the [bot.js](bot.js) file with the following command
```
node --env-file=.env bot.js
```

## Parameters
* --no-roles-deletion: to preserve the server from deleting the team's roles.
* --no-roles-removing: to preserve the server from removing the ephemeral roles of players and staff.
* --no-channels-cleaning: to preserve the server from deleting the team's channels and clearing the remaining tournament channels.
* --backup: to save all the information of the server in a .json file (Categories, Channels, Members, Roles, Emojis, Messages).