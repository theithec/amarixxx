/*#########################################################################
#                                                                         #
#   Updates mixxx' database with amaroks ratings                          #
#                                                                         #
#   Copyright                                                             #
#   (C) 2014 Tim Heithecker - tim.heithecker@gmail.com                    #
#                                                                         #
#	This helped me:                                                       #
#	http://forums.gentoo.org/viewtopic-p-5839391.html (qtscript/sqlite)   #
#   and source from copycover-script (as template) 		                  #
#   and https://github.com/droopy4096/amarok/blob/master/export_rated.py  #
#	(get full path from uuid)                                             #
#                                                                         #
#   This program is free software; you can redistribute it and/or modify  #
#   it under the terms of the GNU General Public License as published by  #
#   the Free Software Foundation; either version 2 of the License, or     #
#   (at your option) any later version.                                   #
#                                                                         #
#   This program is distributed in the hope that it will be useful,       #
#   but WITHOUT ANY WARRANTY; without even the implied warranty of        #
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         #
#   GNU General Public License for more details.                          #
#                                                                         #
#   You should have received a copy of the GNU General Public License     #
#   along with this program; if not, write to the                         #
#   Free Software Foundation, Inc.,                                       #
#   51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.         #
##########################################################################*/

Importer.loadQtBinding("qt.core");
Importer.loadQtBinding("qt.gui" );
Importer.loadQtBinding("qt.uitools" );
Importer.loadQtBinding("qt.sql");


var mainWindow;
var mixxxDBPath;  
var mixxxDB; 
var query;
var countUpdated = 0;
function updateTrackIfDifferent(trackPath, rating){
  var msql = "UPDATE library  SET rating=" + rating  + " WHERE id=(" +                                                                                                               
    "SELECT  l.id FROM track_locations tl, library l " + 
    "WHERE tl.location LIKE \"" + trackPath + "\" AND l.id=tl.id AND l.rating<>" + rating +");";
  Amarok.debug("Amarixxx:Amarok " + msql);
  query.exec(msql);
  if (query.numRowsAffected()>0){
    countUpdated++;
    Amarok.debug("Amarixxx:Mixxx Updated rating=" + rating + " for " + trackPath );

  }

}

function updateMixxx(){
  try{

    Amarok.debug("UPDATE MIXXX");

    amarokSql = "SELECT s.rating, CONCAT(d.lastmountpoint,SUBSTR(u.rpath,2)) " +
      "FROM tracks AS t,urls AS u, statistics AS s, devices AS d " +
      "WHERE t.id=u.id " +
      "AND u.deviceid = d.id " +
      "AND t.id=s.id ;";

    Amarok.debug("Amarixxx:query = "  + amarokSql);
    var amarokTracks = Amarok.Collection.query(amarokSql);

    f = new QFile(mixxxDBPath);
    if (!f.exists()){
      throw(mixxxDBPath + " does not exist");
    }
    mixxxDB = QSqlDatabase.addDatabase("QSQLITE", "");
    mixxxDB.setDatabaseName(mixxxDBPath);
    mixxxDB.open();

    mixxxDB.setDatabaseName(mixxxDBPath);
    mixxxDB.open();
    query = new QSqlQuery(mixxxDB);
  } catch( err ){
    Amarok.debug( err );
    Amarok.alert("Amarixx-Error\n" + err);
  }
  var cnt = 0;
  for (i=0; i< amarokTracks.length; i+=2){
    var rating = Math.floor(amarokTracks[i] / 2);
    var trackPath=amarokTracks[i+1];
    try{
      updateTrackIfDifferent(trackPath, rating);
      cnt = i/2; //  path, rating
      if ( cnt % 1000 == 0){
        Amarok.Window.Statusbar.shortMessage("amarixxx: " + cnt + " songs checked");
      }} catch( err ){
        Amarok.debug( err );
        Amarok.alert("Amarixx-Error\n" + err);
        break;
      }
  }
  mixxxDB.close();
  Amarok.alert("Mixxx db " + countUpdated + " updated.");

}


function saveConfiguration()
{
  mixxxDBPath = mainWindow.lineEdit.text;
  Amarok.Script.writeConfig( "mixxx-DB", mixxxDBPath  );
}

function readConfiguration()
{
  mixxxDBPath = Amarok.Script.readConfig(
      "mixxx-DB",
      QDir.homePath() + "/.mixxx/mixxxdb.sqlite"
      );
  mainWindow.lineEdit.text = mixxxDBPath;
}

function openSettings()
{
  mainWindow.show();
}

function init()
{
  try
  {
    // Ui stuff
    var UIloader = new QUiLoader( this );
    var uifile = new QFile ( Amarok.Info.scriptPath() + "/amarixxx.ui" );
    uifile.open( QIODevice.ReadOnly );
    mainWindow = UIloader.load( uifile, this ); //load the ui file
    uifile.close();


    readConfiguration();
    mainWindow.buttonBox.accepted.connect( saveConfiguration );
    mainWindow.buttonBox.rejected.connect( readConfiguration );

    Amarok.Window.addSettingsMenu( "amarixxx", "Amarixxx Settings", "icon" );
    Amarok.Window.SettingsMenu.amarixxx['triggered()'].connect(openSettings );

    Amarok.Window.addToolsMenu( "upd_mixxx", "Update mixxx", "icon" );
    Amarok.Window.ToolsMenu.upd_mixxx['triggered()'].connect(updateMixxx);

  }
  catch( err )
  {
    Amarok.debug( err );
  }
}

init();
