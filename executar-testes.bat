@echo off
if not exist bin mkdir bin
dir /s /b src\main\java\*.java src\test\java\*.java > sources.txt
javac -d bin @sources.txt
del sources.txt
java -cp bin com.cache.CacheTest
pause
