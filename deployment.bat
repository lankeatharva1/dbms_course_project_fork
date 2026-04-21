@echo off

set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
set INI_FILE="D:\Aditya\Second year\DBMS\DBMS-IT\course_project\deployment.ini"


for /f "tokens=2 delims==" %%a in ('findstr /i "database=" %INI_FILE%') do set DBNAME=%%a


echo I am here dbname=%DBNAME%


%MYSQL_PATH% --defaults-file=%INI_FILE% --database=mysql -e "CREATE DATABASE IF NOT EXISTS %DBNAME%;"


%MYSQL_PATH% --defaults-file=%INI_FILE% %DBNAME% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\drop_tables.sql"
%MYSQL_PATH% --defaults-file=%INI_FILE% %DBNAME% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\user.sql"
%MYSQL_PATH% --defaults-file=%INI_FILE% %DBNAME% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\item_type.sql"
%MYSQL_PATH% --defaults-file=%INI_FILE% %DBNAME% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\complaint.sql"
%MYSQL_PATH% --defaults-file=%INI_FILE% %DBNAME% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\item.sql"
%MYSQL_PATH% --defaults-file=%INI_FILE% %DBNAME% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\complaint_trigger.sql"
%MYSQL_PATH% --defaults-file=%INI_FILE% %DBNAME% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\item_trigger.sql"

echo SQL script executed successfully.
pause
REM Run the SQL file
REM Run the SQL file
REM Run the SQL file
REM Run the SQL file
REM Run the SQL file
REM Run the SQL file
REM %MYSQL_PATH% -u %USER% -p%PASSWORD% %DATABASE% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\drop_tables.sql"
rem %MYSQL_PATH% -u %USER% -p%PASSWORD% %DATABASE% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\user.sql"
rem %MYSQL_PATH% -u %USER% -p%PASSWORD% %DATABASE% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\item_type.sql"
rem %MYSQL_PATH% -u %USER% -p%PASSWORD% %DATABASE% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\complaint.sql"
rem %MYSQL_PATH% -u %USER% -p%PASSWORD% %DATABASE% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\item.sql"
rem %MYSQL_PATH% -u %USER% -p%PASSWORD% %DATABASE% < "D:\Aditya\Second year\DBMS\DBMS-IT\course_project\complaint_trigger.sql"


