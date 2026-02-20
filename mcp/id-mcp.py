# MIT License
#
# Copyright (c) 2025 Mike Chambers
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

from mcp.server.fastmcp import FastMCP
from core import init, sendCommand, createCommand
import socket_client
import sys
import json
import logging
from xliff_service import XliffProcessorService

# Setup logging
logger = logging.getLogger(__name__)

# Create an MCP server
mcp_name = "Adobe InDesign MCP Server"
mcp = FastMCP(mcp_name, log_level="ERROR")
print(f"{mcp_name} running on stdio", file=sys.stderr)

APPLICATION = "indesign"
PROXY_URL = 'http://localhost:3001'
PROXY_TIMEOUT = 20

socket_client.configure(
    app=APPLICATION, 
    url=PROXY_URL,
    timeout=PROXY_TIMEOUT
)

init(APPLICATION, socket_client)

@mcp.tool()
def create_document(
   width: int, 
   height: int, 
   pages: int = 0,
   pages_facing: bool = False,
   columns: dict = {"count": 1, "gutter": 12},
   margins: dict = {"top": 36, "bottom": 36, "left": 36, "right": 36}
):
   """
   Creates a new InDesign document with specified dimensions and layout settings.
   
   Args:
       width (int): Document width in points (1 point = 1/72 inch)
       height (int): Document height in points
       pages (int, optional): Number of pages in the document. Defaults to 0.
       pages_facing (bool, optional): Whether to create facing pages (spread layout). 
           Defaults to False.
       columns (dict, optional): Column layout configuration with keys:
           - count (int): Number of columns per page
           - gutter (int): Space between columns in points
           Defaults to {"count": 1, "gutter": 12}.
       margins (dict, optional): Page margin settings in points with keys:
           - top (int): Top margin
           - bottom (int): Bottom margin  
           - left (int): Left margin
           - right (int): Right margin
           Defaults to {"top": 36, "bottom": 36, "left": 36, "right": 36}.
   
   Returns:
       dict: Result of the command execution from the InDesign UXP plugin
   """
   command = createCommand("createDocument", {
       "intent": "WEB_INTENT",
       "pageWidth": width,
       "pageHeight": height,
       "margins": margins,
       "columns": columns,
       "pagesPerDocument": pages,
       "pagesFacing": pages_facing
   })
   
   return sendCommand(command)

@mcp.tool()
def create_text_frame(
    content: str,
    x: float = 0,
    y: float = 0,
    width: float = 200,
    height: float = 100,
    font_size: float = 12,
    font_name: str = "Arial\tRegular",
    text_color: str = "Black",
    alignment: str = "LEFT",
    paragraph_style: str = None,
    character_style: str = None
):
    """
    Creates a text frame in the active InDesign document.
    
    Args:
        content (str): The text content to place in the text frame.
        x (float, optional): X position (left edge) of the text frame in points. Defaults to 0.
        y (float, optional): Y position (top edge) of the text frame in points. Defaults to 0.
        width (float, optional): Width of the text frame in points. Defaults to 200.
        height (float, optional): Height of the text frame in points. Defaults to 100.
        font_size (float, optional): Font size in points. Defaults to 12.
        font_name (str, optional): Font name in format "FontFamily\tStyle" 
            (e.g., "Arial\tRegular", "Times New Roman\tBold"). Defaults to "Arial\tRegular".
        text_color (str, optional): Name of a color swatch in the document 
            (e.g., "Black", "Paper", "Red"). Defaults to "Black".
        alignment (str, optional): Text alignment. Options: "LEFT", "CENTER", "RIGHT", "JUSTIFY". 
            Defaults to "LEFT".
        paragraph_style (str, optional): Name of an existing paragraph style to apply. 
            If specified, direct formatting (font, size, color, alignment) is ignored.
            Defaults to None.
        character_style (str, optional): Name of an existing character style to apply.
            If specified along with paragraph_style, direct formatting is ignored.
            Defaults to None.
    
    Returns:
        dict: Result containing success status, message, and text frame ID if successful.
    
    Note:
        - Requires an open InDesign document.
        - If paragraph_style or character_style is specified, direct formatting options
          (font_size, font_name, text_color, alignment) will be ignored.
        - Font names should use tab character to separate family and style.
        - Colors must exist as swatches in the document.
    """
    command = createCommand("createTextFrame", {
        "content": content,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "fontSize": font_size,
        "fontName": font_name,
        "textColor": text_color,
        "alignment": alignment,
        "paragraphStyle": paragraph_style,
        "characterStyle": character_style
    })
    
    return sendCommand(command)

@mcp.tool()
def edit_text_frame(
    frame_index: int,
    content: str | None = None,
    font_size: int | None = None,
    font_name: str | None = None,
    text_color: str | None = None,
    alignment: str | None = None
):
    """
    Edits an existing text frame in the active InDesign document.

    Args:
        frame_index (int): Index of the text frame on the active page (0-based).
        content (str, optional): New text content for the text frame.
        font_size (int, optional): Font size in points.
        font_name (str, optional): Font name (must exist in InDesign).
        text_color (str, optional): Color name defined in the document.
        alignment (str, optional): Text alignment.
            Allowed values: "LEFT", "CENTER", "RIGHT", "JUSTIFY".

    Returns:
        dict: Result of the command execution from the InDesign UXP plugin.
    """

    command = createCommand("editTextFrame", {
        "frameIndex": frame_index,
        "content": content,
        "fontSize": font_size,
        "fontName": font_name,
        "textColor": text_color,
        "alignment": alignment
    })

    return sendCommand(command)

@mcp.tool()
def create_table(
    rows: int = 3,
    columns: int = 3,
    x: int | None = None,
    y: int | None = None,
    width: int | None = None,
    height: int | None = None,
    header_rows: int = 1,
    header_columns: int = 0
):
    """
    Creates a table on the active page in InDesign (UXP).

    Args:
        rows (int): Number of body rows. Defaults to 3.
        columns (int): Number of body columns. Defaults to 3.
        x (int, optional): X position of the table frame.
        y (int, optional): Y position of the table frame.
        width (int, optional): Width of the table frame.
        height (int, optional): Height of the table frame.
        header_rows (int, optional): Number of header rows. Defaults to 1.
        header_columns (int, optional): Number of header columns. Defaults to 0.

    Returns:
        dict: Result from the InDesign UXP command
    """

    command = createCommand("createTable", {
        "rows": rows,
        "columns": columns,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "headerRows": header_rows,
        "headerColumns": header_columns
    })

    return sendCommand(command)

@mcp.tool()
def populate_table(
    data: list,
    table_index: int = 0,
    start_row: int = 0,
    start_column: int = 0
):
    """
    Populate an existing table in InDesign with data (UXP).

    Args:
        data (list): 2D array (list of lists) representing table content
        table_index (int, optional): Index of the table on the page. Defaults to 0.
        start_row (int, optional): Starting row index. Defaults to 0.
        start_column (int, optional): Starting column index. Defaults to 0.

    Returns:
        dict: Result from the InDesign UXP command
    """

    command = createCommand("populateTable", {
        "tableIndex": table_index,
        "data": data,
        "startRow": start_row,
        "startColumn": start_column
    })

    return sendCommand(command)

@mcp.tool()
def find_replace_text(
    find_text: str,
    replace_text: str,
    case_sensitive: bool = False,
    whole_word: bool = False
):
    """
    Find and replace text in the active InDesign document.
    
    Args:
        find_text (str): The text to search for.
        replace_text (str): The text to replace found instances with.
        case_sensitive (bool, optional): Whether the search should be case-sensitive. 
            Defaults to False.
        whole_word (bool, optional): Whether to match whole words only. 
            If True, will not match partial words. Defaults to False.
    
    Returns:
        dict: Result containing success status, message, and number of items changed.
    
    Note:
        - Requires an open InDesign document.
        - Uses InDesign's GREP find and replace functionality.
        - All previous find/change preferences are cleared before and after operation.
        - Returns the number of text instances that were successfully replaced.
    """
    command = createCommand("findReplaceText", {
        "findText": find_text,
        "replaceText": replace_text,
        "caseSensitive": case_sensitive,
        "wholeWord": whole_word
    })
    
    return sendCommand(command)


@mcp.tool()
def process_xliff(xliff_file_path: str) -> str:
    """
    Read XLIFF file and extract translation units.
    
    Args:
        xliff_file_path: Path to the XLIFF file
        
    Returns:
        JSON string containing list of translation units with their metadata
    """
    try:
        data = XliffProcessorService.process_xliff(xliff_file_path)
        result = {
            "success": True,
            "message": f"Successfully processed {len(data)} translation units in file {xliff_file_path}",
            "data": [item.model_dump() for item in data]
        }
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Failed to process XLIFF: {str(e)}")
        return json.dumps({
            "success": False,
            "message": f"Error processing XLIFF: {str(e)}",
            "data": []
        })

@mcp.tool()
def process_xliff_with_tags(xliff_file_path: str) -> str:
    """
    Process XLIFF content preserving internal tags for AI translation.
    
    This tool preserves inline tags and markup, making it suitable for AI-assisted translation
    where maintaining formatting is crucial.
    
    Args:
        xliff_file_path: Path to the XLIFF file
        
    Returns:
        JSON string containing translation units with preserved tags
    """
    try:
        data = XliffProcessorService.process_xliff_with_tags(xliff_file_path)
        result = {
            "success": True,
            "message": f"Successfully processed {len(data)} translation units with tags in file {xliff_file_path}",
            "data": [item.model_dump() for item in data]
        }
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Failed to process XLIFF with tags: {str(e)}")
        return json.dumps({
            "success": False,
            "message": f"Error processing XLIFF with tags: {str(e)}",
            "data": []
        })

@mcp.resource("config://get_instructions")
def get_instructions() -> str:
    """Read this first! Returns information and instructions on how to use Photoshop and this API"""

    return f"""
    You are an InDesign and design expert who is creative and loves to help other people learn to use InDesign and create.

    Rules to follow:

    1. Think deeply about how to solve the task
    2. Always check your work
    3. Read the info for the API calls to make sure you understand the requirements and arguments
    """


"""
BLEND_MODES = [
    "COLOR",
    "COLORBURN",
    "COLORDODGE",
    "DARKEN",
    "DARKERCOLOR",
    "DIFFERENCE",
    "DISSOLVE",
    "EXCLUSION",
    "HARDLIGHT",
    "HARDMIX",
    "HUE",
    "LIGHTEN",
    "LIGHTERCOLOR",
    "LINEARBURN",
    "LINEARDODGE",
    "LINEARLIGHT",
    "LUMINOSITY",
    "MULTIPLY",
    "NORMAL",
    "OVERLAY",
    "PINLIGHT",
    "SATURATION",
    "SCREEN",
    "SOFTLIGHT",
    "VIVIDLIGHT",
    "SUBTRACT",
    "DIVIDE"
]
"""