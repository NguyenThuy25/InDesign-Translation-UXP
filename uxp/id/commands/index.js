/* MIT License
 *
 * Copyright (c) 2025 Mike Chambers
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

//const fs = require("uxp").storage.localFileSystem;
//const openfs = require('fs')
// const {app, DocumentIntentOptions} = require("indesign");
const { app, DocumentIntentOptions, Justification, NothingEnum } = require("indesign");



const createDocument = async (command) => {
    console.log("createDocument")

    const options = command.options

    let documents = app.documents
    let margins = options.margins

    let unit = getUnitForIntent(DocumentIntentOptions.WEB_INTENT)

    app.marginPreferences.bottom = `${margins.bottom}${unit}`
    app.marginPreferences.top = `${margins.top}${unit}`
    app.marginPreferences.left = `${margins.left}${unit}`
    app.marginPreferences.right = `${margins.right}${unit}`

    app.marginPreferences.columnCount = options.columns.count
    app.marginPreferences.columnGutter = `${options.columns.gutter}${unit}`
    

    let documentPreferences = {
        pageWidth: `${options.pageWidth}${unit}`,
        pageHeight: `${options.pageHeight}${unit}`,
        pagesPerDocument: options.pagesPerDocument,
        facingPages: options.facingPages,
        intent: DocumentIntentOptions.WEB_INTENT
    }

    const showingWindow = true
    //Boolean showingWindow, DocumentPreset documentPreset, Object withProperties 
    documents.add({showingWindow, documentPreferences})
}




const createTextFrame = async (command) => {
    console.log("createTextFrame")
    console.log("🔥🔥🔥 UXP createTextFrame CALLED 🔥🔥🔥")

    const options = command.options
    const document = app.activeDocument

    if (!document) {
        throw new Error("No active document. Please create or open a document first.")
    }

    // Try to get the first page - use item(0) method for collection access
    let page = null
    try {
        const pagesCount = document.pages.length
        console.log("document.pages.length", pagesCount)
        
        if (pagesCount > 0) {
            page = document.pages.item(0)
            // Check if page is valid
            if (!page || !page.isValid) {
                console.log("Page from item(0) is not valid, trying firstItem()")
                page = document.pages.firstItem()
            }
        }
    } catch (e) {
        console.log("Error accessing pages:", e.message)
    }

    // If still no page or page is not valid, try to add one
    if (!page || !page.isValid) {
        try {
            page = document.pages.add()
            console.log("Added new page")
        } catch (e) {
            console.log("Error adding page:", e.message)
        }
    }

    // Final validation
    if (!page || !page.isValid) {
        throw new Error("No page available in the document.")
    }

    console.log("Page obtained successfully, page id:", page.id)



    const unit = getUnitForIntent(document.documentPreferences.intent)

    // Extract positioning options with defaults
    const x = options.x ?? 0
    const y = options.y ?? 0
    const width = options.width ?? 200
    const height = options.height ?? 100
    const content = options.content ?? ""
    const fontSize = options.fontSize ?? 12
    const fontName = options.fontName ?? "Arial\tRegular"
    const textColor = options.textColor ?? "Black"
    const alignment = options.alignment ?? "LEFT"
    const paragraphStyleName = options.paragraphStyle ?? null
    const characterStyleName = options.characterStyle ?? null

    // Create text frame with geometric bounds [top, left, bottom, right]
    const geometricBounds = [
        `${y}${unit}`,
        `${x}${unit}`,
        `${y + height}${unit}`,
        `${x + width}${unit}`
    ]

    const textFrame = page.textFrames.add({
        geometricBounds: geometricBounds
    })

    // Set content
    textFrame.contents = content

    let styleMessage = ""

    // Only apply formatting if there's content
    if (content && content.length > 0) {
        // Get all text in the text frame for formatting
        const allText = textFrame.texts.item(0)
        
        if (allText && allText.isValid) {
            // Apply paragraph style if specified
            if (paragraphStyleName) {
                try {
                    const paragraphStyle = document.paragraphStyles.itemByName(paragraphStyleName)
                    if (paragraphStyle && paragraphStyle.isValid) {
                        allText.appliedParagraphStyle = paragraphStyle
                        styleMessage += `Paragraph style '${paragraphStyleName}' applied. `
                    } else {
                        styleMessage += `Paragraph style '${paragraphStyleName}' not found. `
                    }
                } catch (styleError) {
                    styleMessage += `Error applying paragraph style: ${styleError.message}. `
                }
            }

            // Apply character style if specified
            if (characterStyleName) {
                try {
                    const characterStyle = document.characterStyles.itemByName(characterStyleName)
                    if (characterStyle && characterStyle.isValid) {
                        allText.appliedCharacterStyle = characterStyle
                        styleMessage += `Character style '${characterStyleName}' applied. `
                    } else {
                        styleMessage += `Character style '${characterStyleName}' not found. `
                    }
                } catch (styleError) {
                    styleMessage += `Error applying character style: ${styleError.message}. `
                }
            }

            // Apply direct formatting only if no styles were applied
            if (!paragraphStyleName && !characterStyleName) {
                // Apply font
                try {
                    const font = app.fonts.itemByName(fontName)
                    if (font && font.isValid) {
                        allText.appliedFont = font
                    }
                } catch (fontError) {
                    console.warn("Font not found:", fontName, fontError.message)
                }

                // Apply font size
                try {
                    allText.pointSize = fontSize
                } catch (sizeError) {
                    console.warn("Could not apply font size:", sizeError.message)
                }

                // Apply text color
                if (textColor !== "Black") {
                    try {
                        const color = document.colors.itemByName(textColor)
                        if (color && color.isValid) {
                            allText.fillColor = color
                        }
                    } catch (colorError) {
                        console.log("Could not apply color:", colorError.message)
                    }
                }

                // Apply alignment/justification
                try {
                    const normalizedAlignment = alignment.toUpperCase()
                    switch (normalizedAlignment) {
                        case "CENTER":
                            allText.justification = Justification.CENTER_ALIGN
                            break
                        case "RIGHT":
                            allText.justification = Justification.RIGHT_ALIGN
                            break
                        case "JUSTIFY":
                            allText.justification = Justification.FULLY_JUSTIFIED
                            break
                        case "LEFT":
                        default:
                            allText.justification = Justification.LEFT_ALIGN
                            break
                    }
                } catch (alignError) {
                    console.warn("Could not apply alignment:", alignError.message)
                }
            }
        } else {
            console.log("No valid text object found in text frame")
        }
    }

    return {
        success: true,
        message: `Text frame created successfully. ${styleMessage}`.trim(),
        textFrameId: textFrame.id
    }
}


/**
 * Edit an existing text frame (UXP version)
 */
const editTextFrame = async (command) => {
    const {
        frameIndex,
        content,
        fontSize,
        fontName,
        textColor,
        alignment
    } = command.options || {};

    try {
        // 1. Check document
        if (app.documents.length === 0) {
            throw new Error("No document open");
        }

        const doc = app.documents.item(0);
        const page =
            app.activeWindow?.activePage || doc.pages.item(0);

        // 2. Validate frame index
        if (frameIndex == null || frameIndex >= page.textFrames.length) {
            throw new Error("Text frame index out of range");
        }

        const textFrame = page.textFrames.item(frameIndex);
        const text = textFrame.texts.item(0);

        // 3. Update content
        if (typeof content === "string" && content !== "") {
            textFrame.contents = content;
        }

        // 4. Update font size
        if (typeof fontSize === "number" && fontSize > 0) {
            text.pointSize = fontSize;
        }

        // 5. Update font
        if (typeof fontName === "string" && fontName.trim() !== "") {
            const fontRef = app.fonts.itemByName(fontName);
            if (fontRef.isValid) {
                text.appliedFont = fontRef;
            }
        }

        // 6. Update text color
        if (typeof textColor === "string" && textColor.trim() !== "") {
            const colorRef = app.colors.itemByName(textColor.trim());
            if (colorRef.isValid) {
                text.fillColor = colorRef;
            }
        }

        // 7. Update alignment
        if (typeof alignment === "string") {
            switch (alignment.trim().toUpperCase()) {
                case "CENTER":
                    text.justification = Justification.CENTER_ALIGN;
                    break;
                case "RIGHT":
                    text.justification = Justification.RIGHT_ALIGN;
                    break;
                case "JUSTIFY":
                    text.justification = Justification.FULLY_JUSTIFIED;
                    break;
                default:
                    text.justification = Justification.LEFT_ALIGN;
            }
        }

        return {
            status: "success",
            message: "Text frame updated successfully"
        };

    } catch (error) {
        return {
            status: "error",
            message: `Error updating text frame: ${error.message}`
        };
    }
};

/**
 * Create a table on the active page (UXP version)
 */
const createTable = async (command) => {
    const {
        rows = 3,
        columns = 3,
        x,
        y,
        width,
        height,
        headerRows = 1,
        headerColumns = 0
    } = command.options || {};

    try {
        if (app.documents.length === 0) {
            throw new Error("No document open");
        }

        const doc = app.documents.item(0);
        const page = app.activeWindow?.activePage || doc.pages.item(0);

        // Fallback positioning (UXP không có sessionManager như ExtendScript repo)
        const pageBounds = page.bounds; // [y1, x1, y2, x2]
        const frameX = x ?? pageBounds[1] + 36;
        const frameY = y ?? pageBounds[0] + 36;
        const frameWidth = width ?? 200;
        const frameHeight = height ?? 100;

        // Create text frame
        const textFrame = page.textFrames.add();
        textFrame.geometricBounds = [
            frameY,
            frameX,
            frameY + frameHeight,
            frameX + frameWidth
        ];

        // Create table
        const table = textFrame.insertionPoints
            .item(0)
            .tables.add({
                bodyRowCount: rows,
                bodyColumnCount: columns
            });

        // Header settings
        table.headerRowCount = headerRows;
        table.headerColumnCount = headerColumns;

        return {
            status: "success",
            message: "Table created successfully",
            data: {
                rows,
                columns,
                headerRows,
                headerColumns
            }
        };

    } catch (error) {
        return {
            status: "error",
            message: `Error creating table: ${error.message}`
        };
    }
};

/**
 * Find and replace text in the document (UXP version)
 */
const findReplaceText = async (command) => {
    const {
        findText,
        replaceText,
        caseSensitive = false,
        wholeWord = false
    } = command.options || {};

    try {
        if (app.documents.length === 0) {
            throw new Error("No document open");
        }
        const doc = app.activeDocument;
        
        //Clear the find/change text preferences.
        app.findTextPreferences = NothingEnum.nothing;
        app.changeTextPreferences = NothingEnum.nothing;

        //Search the document for the string findText
        app.findTextPreferences.findWhat = findText;

        // Set find options
        app.findChangeTextOptions.caseSensitive = caseSensitive;
        app.findChangeTextOptions.wholeWord = wholeWord;

        var foundItems = doc.findText();

        if (foundItems.length === 0) {
            return {
                status: "success",
                message: "No matches found for the specified findText.",    
            };
        }

        for(let i = 0; i < foundItems.length; i++) {
            foundItems[i].contents = replaceText;
        }

        return {
            status: "success",
            message: `Find and replace completed. Items changed: ${foundItems.length}`,
            data: {
                itemsChanged: foundItems.length,
                findText: findText,
                replaceText: replaceText,
                caseSensitive: caseSensitive,
                wholeWord: wholeWord
            }
        };

    } catch (error) {
        return {
            status: "error",
            message: `Error during find and replace: ${error.message}`
        };
    } finally {
        // Always clear preferences after operation
        try {
            app.findTextPreferences = NothingEnum.nothing;
            app.changeTextPreferences = NothingEnum.nothing;
        } catch (clearError) {
            console.log("Error clearing preferences:", clearError.message);
        }
    }
};

/**
 * Populate a table with data (UXP version)
 */
const populateTable = async (command) => {
    const {
        tableIndex = 0,
        data,
        startRow = 0,
        startColumn = 0
    } = command.options || {};

    try {
        if (!Array.isArray(data)) {
            throw new Error("Invalid data provided. Expected array of arrays.");
        }

        if (app.documents.length === 0) {
            throw new Error("No document open");
        }

        const doc = app.documents.item(0);
        const page = app.activeWindow?.activePage || doc.pages.item(0);

        let targetTable = null;
        let tableCount = 0;

        // Find table by index (same logic as ExtendScript)
        for (let i = 0; i < page.textFrames.length; i++) {
            const textFrame = page.textFrames.item(i);

            if (textFrame.tables.length > 0) {
                if (tableCount === tableIndex) {
                    targetTable = textFrame.tables.item(0);
                    break;
                }
                tableCount++;
            }
        }

        if (!targetTable) {
            throw new Error(`Table index ${tableIndex} not found`);
        }

        // Populate table
        for (let r = 0; r < data.length; r++) {
            for (let c = 0; c < data[r].length; c++) {
                const cellRow = startRow + r;
                const cellCol = startColumn + c;

                if (
                    cellRow < targetTable.rows.length &&
                    cellCol < targetTable.columns.length
                ) {
                    const rowObj = targetTable.rows.item(cellRow);
                    const cell = rowObj.cells.item(cellCol);

                    const value = String(data[r][c]); // ✅ BỔ SUNG DÒNG NÀY
                    cell.contents = value;
                }
            }
        }

        return {
            status: "success",
            message: "Table populated successfully",
            data: {
                tableIndex,
                startRow,
                startColumn
            }
        };

    } catch (error) {
        return {
            status: "error",
            message: `Error populating table: ${error.message}`
        };
    }
};

const openDocument = async (command) => {
    try {
        console.log("=== OPENDOCUMENT V4 CALLED ===");
        const { filePath } = command.options;

        if (!filePath) {
            return {
                status: "error",
                message: "File path is required"
            };
        }

        // Normalize path - handle double backslashes from JSON
        let normalizedPath = filePath.replace(/\\\\/g, '\\');
        console.log("Original path:", filePath);
        console.log("Normalized path:", normalizedPath);
        
        // Use UXP localFileSystem.getEntryWithUrl approach
        const { localFileSystem } = require('uxp').storage;
        
        console.log("Getting file entry with URL...");
        const entry = await localFileSystem.getEntryWithUrl(normalizedPath);

        if (!entry) {
            console.log("File entry not found via getEntryWithUrl");
            return {
                status: "error",
                message: `File not found: ${normalizedPath}`
            };
        }

        console.log("File entry found, attempting to open with app.open()...");
        console.log("Entry name:", entry.name);
        
        const document = app.open(entry);
        
        if (!document) {
            console.log("app.open() returned null/undefined");
            return {
                status: "error",
                message: "app.open() failed to return document object"
            };
        }

        console.log("SUCCESS: Document opened via app.open():", document.name);
        return {
            status: "success",
            message: `Document opened: ${document.name}`,
            data: {
                documentName: document.name,
                filePath: normalizedPath,
                method: "getEntryWithUrl + app.open"
            }
        };

    } catch (error) {
        console.error("ERROR in openDocument:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        return {
            status: "error",
            message: `Error opening document: ${error.message || 'Unknown error'}`
        };
    }
};


const getUnitForIntent = (intent) => {

    if(intent && intent.toString() === DocumentIntentOptions.WEB_INTENT.toString()) {
        return "px"
    }
    
    if(intent && intent.toString() === DocumentIntentOptions.PRINT_INTENT.toString()) {
        return "pt"
    }

    throw new Error(`getUnitForIntent : unknown intent [${intent}]`)
}

const parseAndRouteCommand = async (command) => {
    let action = command.action;

    let f = commandHandlers[action];

    if (typeof f !== "function") {
        throw new Error(`Unknown Command: ${action}`);
    }
    
    console.log(f.name)
    return f(command);
};


const commandHandlers = {
    createDocument,
    createTextFrame,
    editTextFrame,
    findReplaceText,
    createTable,
    populateTable,
    openDocument
};


const getActiveDocumentSettings = (command) => {
    const document = app.activeDocument


    const d = document.documentPreferences
    const documentPreferences = {
        pageWidth:d.pageWidth,
        pageHeight:d.pageHeight,
        pagesPerDocument:d.pagesPerDocument,
        facingPages:d.facingPages,
        measurementUnit:getUnitForIntent(d.intent)
    }

    const marginPreferences = {
        top:document.marginPreferences.top,
        bottom:document.marginPreferences.bottom,
        left:document.marginPreferences.left,
        right:document.marginPreferences.right,
        columnCount : document.marginPreferences.columnCount,
        columnGutter : document.marginPreferences.columnGutter
    }
    return {documentPreferences, marginPreferences}
}

const checkRequiresActiveDocument = async (command) => {
    if (!requiresActiveDocument(command)) {
        return;
    }

    let document = app.activeDocument
    if (!document) {
        throw new Error(
            `${command.action} : Requires an open InDesign document`
        );
    }
};

const requiresActiveDocument = (command) => {
    return !["createDocument", "openDocument"].includes(command.action);
};


module.exports = {
    getActiveDocumentSettings,
    checkRequiresActiveDocument,
    parseAndRouteCommand,
    requiresActiveDocument
};
