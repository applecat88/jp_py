@echo off
cd /d "%~dp0"
py -3 study_server.py
if errorlevel 1 pause
