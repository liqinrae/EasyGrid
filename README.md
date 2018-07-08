# EasyGrid
EasyGrid is a lightweight JavaScript control that provides a way of displaying and manipulating tabular data on the web. The grid control loads the data dynamically through Ajax callbacks. EasyGrid uses JQuery UI Library and is built using the Widget Factory. For more information on JQuery Widgets, please refer to jQuery Widgets web site.

# Requirements
You would need: 
jQuery widget,
jQuery UI library – version 1.12.1
jQuery library – version 3.3.1
jQuery dateFormat library - version 1.0.2
browsers: web browser (IE 7.0+, Firefox 2.0+ and Google Chrome)


# How it works: 
There are two major divisions of the plugin: 

Server-side / Local data manipulation
Client-side representation 

Server-side Manipulation (SSM) : the server handles the editing (eg: sorting, updating and deleting data) and deals with information stored in the database. After the server returns requested information back to the client (web browser), afGrid uses Ajax calls to retrieve the requested information and display it to the client. 

Local Data Manipulation: Users are also allowed to create grid based on local data source. In this case, afGrid supports basic editing features for local data such as sorting, formatting, etc and represent the data to clients. 


