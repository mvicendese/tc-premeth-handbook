# tc-premeth-handbook

Subject handbook for premethods

## Development server (for matt)

0. Check `README.md` for updated instructions

1. Open up two ubuntu terminal windows

2. In first terminal window, run the following commands, waiting for each to execute in order
    - `cd ~/dev/tc-premeth-handbook`
    - `git fetch --all && git reset --hard origin/master`
    - `npm i`
    - `ng serve`
    
3. In second terminal window, run the following commands
    - `cd ~/dev/tc-premeth-handbook/src/api`
    - `pip3 install -r requirements.txt`
    - `python manage.py runserver`
    
4. Go to 'http://localhost:8000/api' to check if the api server is running
5. Navigate to 'http://localhost:4200'

