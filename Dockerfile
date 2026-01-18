# We use the official TeX Live image. 
# It includes all standard packages, fonts (EB Garamond), and Lua modules.
FROM texlive/texlive:latest

# Set the working directory inside the container
WORKDIR /data

# Default command: Compile the resume using LuaLaTeX
# -interaction=nonstopmode: Prevents the build from hanging on errors
# -shell-escape: Often needed for complex Lua integrations (optional but safe here)
CMD ["lualatex", "-interaction=nonstopmode", "-shell-escape", "main.tex"]