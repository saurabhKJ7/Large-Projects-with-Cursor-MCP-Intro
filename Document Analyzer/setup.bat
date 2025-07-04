@echo off
setlocal enabledelayedexpansion

echo ===================================
echo Document Analyzer Setup for Windows
echo ===================================
echo.

:: Check Python version
echo Checking Python version...
python --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH. Please install Python 3.7 or higher.
    exit /b 1
)

python -c "import sys; print(sys.version_info >= (3,7))" > .pyversion
set /p PYVERSION=<.pyversion
del .pyversion

if "%PYVERSION%"=="False" (
    echo Python 3.7 or higher is required. Please upgrade your Python installation.
    exit /b 1
)

echo Python version check passed.
echo.

:: Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to create virtual environment.
        exit /b 1
    )
    echo Virtual environment created successfully.
) else (
    echo Virtual environment already exists.
)
echo.

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
if %ERRORLEVEL% NEQ 0 (
    echo Failed to activate virtual environment.
    exit /b 1
)
echo Virtual environment activated.
echo.

:: Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies.
    exit /b 1
)
echo Dependencies installed successfully.
echo.

:: Create data directory if it doesn't exist
if not exist data (
    echo Creating data directory...
    mkdir data
    echo Data directory created.
) else (
    echo Data directory already exists.
)
echo.

:: Ask if user wants to generate sample data
set /p GENERATE_SAMPLES=Do you want to generate sample documents? (y/n): 
if /i "%GENERATE_SAMPLES%"=="y" (
    echo Generating sample documents...
    python generate_sample_data.py
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to generate sample documents.
    ) else (
        echo Sample documents generated successfully.
    )
    echo.
)

echo ===================================
echo Setup completed successfully!
echo ===================================
echo.
echo You can now run the following commands:
echo.
echo - Start the MCP server:
    echo   python -m mcp serve server.py
echo.
echo - Run the client example:
    echo   python client_example.py
echo.
echo - Run the web application:
    echo   python web_app_example.py
echo.
echo - Run tests:
    echo   python test_server.py
echo.
echo - Generate sample data (if not already done):
    echo   python generate_sample_data.py
echo.

:: Keep the window open
pause