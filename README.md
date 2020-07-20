# MuseumCovid19
Application made on Nextcloud with the aim to create an online museum of COVID-19

Instructions to run application on terminal :

mkdir /.../covid-app
cd /.../covid-app
git clone https://github.com/pierre-louisN/MuseumCovid19/
apt-get install aws 
apt-get install uuid
apt-get install nodejs
apt-get install redis
apt get install redis-server
apt-get install socket.io

node app.js

How to use the app :
First when you arrive on the homepage, you are invited to enter your google credentials and chose the language 
then you can read about the project. 
After that you can proceed on the museum, enter your infos and load your files. 
You can see the results from Rekognition in a table below. 

FInally, you can go to 'Treemaps' and visualize the Treemaps for the number of objects per country and per period (or all).
You can also see the Treemap for one period and one object in particular if you wish so, in 'Other'. 

