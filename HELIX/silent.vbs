' HELIX Silent Background Runner (Windows)
' Executes batch or command scripts silently without opening a console window.
'
' Usage:
'   wscript.exe silent.vbs run-start.bat
'   wscript.exe silent.vbs run-dev.bat

Set WshShell = CreateObject("WScript.Shell")

If WScript.Arguments.Count = 0 Then
    WScript.Echo "Usage: wscript.exe silent.vbs <script.bat|script.cmd>"
    WScript.Quit 1
End If

Dim cmdLine, i, arg
cmdLine = ""

For i = 0 To WScript.Arguments.Count - 1
    arg = WScript.Arguments(i)
    If InStr(arg, " ") > 0 Then
        cmdLine = cmdLine & """" & arg & """ "
    Else
        cmdLine = cmdLine & arg & " "
    End If
Next

cmdLine = Trim(cmdLine)

' If targeting a .bat or .cmd script directly, prefix with cmd.exe /c
If LCase(Right(WScript.Arguments(0), 4)) = ".bat" Or LCase(Right(WScript.Arguments(0), 4)) = ".cmd" Then
    cmdLine = "cmd.exe /c """ & cmdLine & """"
End If

' 0 = Hide window, False = Do not wait for script termination
WshShell.Run cmdLine, 0, False
