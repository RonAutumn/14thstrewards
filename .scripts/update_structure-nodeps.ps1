# Output file
$OUTPUT_FILE = ".cursor/rules/structure.mdc"

# Create the output directory if it doesn't exist
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OUTPUT_FILE) | Out-Null

# Create the output file with header
"# Project Structure" | Set-Content $OUTPUT_FILE
"" | Add-Content $OUTPUT_FILE
"```" | Add-Content $OUTPUT_FILE

# Get directory structure
Get-ChildItem -Path . -Recurse | 
    Select-Object FullName | 
    ForEach-Object { 
        $relativePath = $_.FullName.Replace($PWD.Path + "\", "")
        $indent = "  " * ($relativePath.Split("\").Count - 1)
        "$indent|-- $($relativePath.Split("\")[-1])"
    } | Add-Content $OUTPUT_FILE

# Close the code block
"```" | Add-Content $OUTPUT_FILE

Write-Host "Project structure has been updated in $OUTPUT_FILE" 