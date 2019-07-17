# Deploy steps:

1. `npm install`
2. `npm install -g firebase-tools`
3. `firebase login` 
	and pick your account
4. set up configs

	* go to https://console.firebase.google.com/u/1/project/taptag-info/settings/serviceaccounts/adminsdk
	* press Generete new key
	* go to the downloaded file and copy all json content
	* go to serviceAccount.json file in the project
	* put generated credentials into serviceAccount.json
	* save the file
	
	* go to everipixelConfig.json file in the project
	* and put everipixel credentials into everipixelConfig.json file
	* save the file

5. `firebase deploy`
