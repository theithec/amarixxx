/*#########################################################################
#                                                                         #
#   Updates mixxx' database with amaroks ratings              			  #
#                                                                         #
#   Copyright                                                             #
#   (C) 2014 Tim Heithecker  tim.heithecker@gmail.com					  #
#																		  #
#	This helped me:														  #
#	http://forums.gentoo.org/viewtopic-p-5839391.html 
#   and source from copycover-script 					  #
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
Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );
Importer.loadQtBinding("qt.sql");


// no idea how to get the absolute path of an url
var mountPoint = "/"
	
var mainWindow; 

function updateMixxx(){
	
	var homeDir = QDir.homePath();
	var dbPath = homeDir + "/.mixxx/mixxxdb.sqlite";
	
	var tracks = Amarok.Collection.query("" +
	"SELECT title, rpath, rating FROM tracks,urls, statistics WHERE tracks.id=urls.id AND tracks.id=statistics.id ;");
	
	//mixxx
	var m_db = QSqlDatabase.addDatabase("QSQLITE", "");
	m_db.setDatabaseName(dbPath);
	m_db.open();
	var query = new QSqlQuery(m_db);
	
	for (i=0; i< tracks.length; i+=3){
		title = tracks[i];
		rpath = tracks[i+1];
		a_rating = tracks[i+2];
		m_rating = Math.floor(a_rating/2);
		
		fpath = mountPoint + rpath.slice(1);
		
		updsql = (	"UPDATE library " +
					"SET rating=" + m_rating +" WHERE id = ("+
					"	SELECT  library.id  FROM track_locations, library " + 
					"	WHERE   track_locations.location=\"" + fpath  + "\" AND " +
					"		 library.location=track_locations.id)"
		);
		query.exec(updsql);
		Amarok.debug("Amarixxx found " + fpath + " " + a_rating);
		nr = Math.floor(i/3)
		if (nr % 1000 == 0){
			Amarok.Window.Statusbar.shortMessage("amarixxx: " + nr + " songs updated");
		}
	}
	m_db.close();
	Amarok.alert("Mixxx db updated.");
}

function saveConfiguration()
{
	mountPoint = mainWindow.lineEdit.text;
	Amarok.Script.writeConfig( "mountPoint", mountPoint  );
}

function readConfiguration()
{
	mountPoint = Amarok.Script.readConfig( "mountPoint", mountPoint )
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

        // read configuration
        readConfiguration();

        // connect the button ok/cancel to save/read config.
        mainWindow.buttonBox.accepted.connect( saveConfiguration );
        mainWindow.buttonBox.rejected.connect( readConfiguration );
        
        // Add tool menu, and a callback
        Amarok.Window.addSettingsMenu( "amarixxx", "Amarixxx Settings", "amarok" );
        Amarok.Window.SettingsMenu.amarixxx['triggered()'].connect(openSettings );
        
        Amarok.Window.addToolsMenu( "upd_mixxx", "Update mixxx", "amarok" );
        Amarok.Window.SettingsMenu.upd_mixxx['triggered()'].connect(updateMixxx);
        
 
    }
    catch( err )
    {
        Amarok.debug( err );
    }
}

var writeCover = true;
var writeArtistAlbum = false;
init();
