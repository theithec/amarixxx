/*#########################################################################
#                                                                         #
#   Updates mixxx' database with amaroks ratings                          #
#                                                                         #
#   Copyright                                                             #
#   (C) 2014 Tim Heithecker - tim.heithecker@gmail.com                    #
#                                                                         #
#	This helped me:                                                       #
#	http://forums.gentoo.org/viewtopic-p-5839391.html                     #
#   and source from copycover-script                                      #
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


// no idea how to get easily the absolute path of an url
var mountPoint = "/";

var mainWindow;

function updateMixxx(){
	Amarok.debug("UPDATE MIXXX");
	var homeDir = QDir.homePath();
	var dbPath = homeDir + "/.mixxx/mixxxdb.sqlite";

	var tracks = Amarok.Collection.query("" +
    	"SELECT title, rpath, rating " +
    	"FROM tracks,urls, statistics " +
    	"WHERE tracks.id=urls.id AND tracks.id=statistics.id ;");

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
		res = query.exec(updsql);
		Amarok.debug("Amarixxx:Amarok " + fpath + " " + a_rating);
		Amarok.debug("Amarixxx:Mixxx " + res);
		nr = i/3; // 3 = title, rpath, rating
		if ( nr % 1000 == 0){
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
	mountPoint = Amarok.Script.readConfig( "mountPoint", mountPoint );
	mainWindow.lineEdit.text = mountPoint;
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
