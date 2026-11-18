@echo off
echo ========================================================
echo  Compilando In-Process Cache Manager (Java)...
echo ========================================================
if not exist bin mkdir bin
dir /s /b src\main\java\*.java src\test\java\*.java > sources.txt
javac -d bin @sources.txt
del sources.txt

echo.
echo ========================================================
echo  Executando Demonstracao Pratica (Parte 3)...
echo ========================================================
java -cp bin com.cache.demo.DemonstracaoPratica

echo.
echo ========================================================
echo  Executando Demonstracao de Extensibilidade (LFU - OCP)...
echo ========================================================
java -cp bin com.cache.demo.DemonstracaoExtensibilidade
pause
