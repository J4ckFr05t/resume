require("lualibs") 

function getJsonFromFile(file)
  local fileHandle = io.open(file)
  
  -- Safety check: if file doesn't exist, return empty table to prevent crash
  if not fileHandle then
      return {} 
  end
  
  local jsonString = fileHandle:read('*a')
  
  -- FIX: Use colon (:) syntax for file operations
  fileHandle:close()
  
  local jsonData = utilities.json.tolua(jsonString)
  return jsonData
end

function printEduItems(file)
  local json = getJsonFromFile(file)
  -- FIX: Use ipairs() to keep Education items in the correct order
  for i, value in ipairs(json) do
    tex.print("\\resumeEduEntry")
    tex.print("{" .. value["school"] .. "}")
    tex.print("{" .. value["school_location"] .. "}")
    tex.print("{" .. value["degree"] .. "}")
    tex.print("{" .. value["time_period"] .. "}")
  end
end

function printExpItems(file)
  local json = getJsonFromFile(file)
  -- FIX: Use ipairs() to keep Experience items in the correct order
  for i, value in ipairs(json) do
    tex.print("\\resumeExpEntry")
    tex.print("{" .. value["company"] .. "}")
    tex.print("{" .. value["company_location"] .. "}")
    tex.print("{" .. value["role"] .. "}")
    tex.print("{" .. value["team"] .. "}")
    tex.print("{" .. value["time_duration"] .. "}")

    tex.print("\\resumeItemListStart")
    -- Details list must also be ordered
    for j, detail in ipairs(value["details"]) do
      tex.print("\\resumeItem")
      tex.print("{" .. detail["title"] .. "}")
      tex.print("{" .. detail["description"] .. "}")
    end
    tex.print("\\resumeItemListEnd")
  end
end

function printProjItems(file)
  local json = getJsonFromFile(file)
  for i, value in ipairs(json) do
    tex.print("\\resumeSubItem")
    tex.print("{" .. value["title"] .. "}")
    tex.print("{" .. value["description"] .. "}")
  end
end

function printCertItems(file)
  local json = getJsonFromFile(file)
  for i, value in ipairs(json) do
    tex.print("\\resumeSubItem")
    tex.print("{" .. value["name"] .. ", " .. value["issuer"] .. "}")
    tex.print("{" .. value["year"] .. "}")
  end
end

function printAchieveItems(file)
  local json = getJsonFromFile(file)
  for i, value in ipairs(json) do
    tex.print("\\resumeSubItem")
    tex.print("{" .. value["title"] .. "}")
    tex.print("{}")
  end
end

function printHeading(file)
  local json = getJsonFromFile(file)
  -- Headings are usually single items, so ipairs is safe here too
  for i, value in ipairs(json) do
    tex.print("\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}")

    tex.print("\\textbf{\\href")
    tex.print("{" .. value["linkedin"] .. "/}")
    tex.print("{\\Large " .. value["name"] .. "}}")
    tex.print(" & Email : \\href")
    tex.print("{mailto:" .. value["email"] .. "}")
    tex.print("{" .. value["email"] .. "}\\\\")

    tex.print("\\href")
    tex.print("{" .. value["website"] .. "/}")
    tex.print("{" .. value["website"] .. "}")
    tex.print(" & Mobile : " .. value["phone"] .. "\\\\")

    tex.print("\\end{tabular*}")
  end
end

function printList(file, primary, secondary)
  local json = getJsonFromFile(file)
  local first = true
  
  -- Assuming the structure is a list of objects
  for i, outerValue in ipairs(json) do
      -- Check if primary key exists and is a table
      if outerValue[primary] then
        for j, innerValue in ipairs(outerValue[primary]) do
          if (first) then
            tex.print(innerValue[secondary])
            first = false
          else
            tex.print(", " .. innerValue[secondary])
          end
        end
      end
  end
end

function printSummary(file)
  local json = getJsonFromFile(file)
  for i, value in ipairs(json) do
    if value["summary"] then
      tex.print(value["summary"])
    end
  end
end