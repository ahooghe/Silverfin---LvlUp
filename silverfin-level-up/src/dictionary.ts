export const silverfinDictionary: {
    [key: string]: string | { description: string; example?: string; attributes?: { [key: string]: string | { description: string; options?: { [key: string]: string } } } };
} = {
    "input": {
        "description": "The `input` tag allows you to create input fields in Silverfin templates. For more details on attributes, hover over specific attributes like `as`.",
        "example": "{% input custom.namespace.key %}",
        "attributes": {
            "as": "Specifies the type of input field. Hover over `as` for more details.",
            "default": "Sets a default value for the input field.",
            "placeholder": "Changes the placeholder text displayed in the input field.",
            "required": "Makes the input field mandatory.",
            "validation": "Guides the user to create the correct data type (e.g., only positive values)."
        }
    },
    "as": {
        "description": "The `as` attribute changes the data type of the input field. Available types include:\n- **none**\n- **text**\n- **currency**\n- **integer**\n- **percentage**\n- **boolean**\n- **date**\n- **file**\n- **select**\n- **account_collection**\n- **external_account_collection**\n- **external_company_collection**"
    },
    "as:currency": {
        "description": "The `currency` type specifies a numeric value with decimals.",
        "attributes": {
            "invert": "Stores a currency with the opposite sign of what has been inputted."
        }
    },
    "as:percentage": {
        "description": "The `percentage` type specifies a percentage value.",
        "attributes": {
            "precision": "Defines the number of decimals stored.",
            "strip_insignificant_zeros": "Removes trailing zeros from percentage values."
        }
    },
    "as:date": {
        "description": "The `date` type specifies a date picker that stores the date as a string.",
        "attributes": {
            "format": "Customizes how the date is displayed inside the input field."
        }
    },
    "as:file": {
        "description": "The `file` type specifies a paperclip to attach one or multiple files.",
        "attributes": {
            "max_size": "Limits the size of attachments in MB."
        }
    },
    "as:integer": {
        "description": "The `integer` type specifies a numeric value without decimals. Rounds to the nearest whole number."
    },
    "as:text": {
        "description": "The `text` type specifies a standard string field as a text input."
    },
    "as:none": {
        "description": "The `none` type specifies no attribute, resulting in a standard string field."
    },
    "as:boolean": {
        "description": "The `boolean` type specifies a checkbox with values `blank`, `true`, or `false`."
    },
    "as:select": {
        "description": "The `select` type specifies a dropdown input. Needs the `options` attribute. Also accepts `option_values`."
    },
    "as:account_collection": {
        "description": "The `account_collection` type allows selecting accounts from a certain range. Needs the `range` attribute. Also accepts `accounts_var`."
    },
    "as:external_account_collection": {
        "description": "The `external_account_collection` type allows selecting accounts from an external company. Needs `range` and `company` attributes."
    },
    "as:external_company_collection": {
        "description": "The `external_company_collection` type allows selecting companies from the Company links. Accepts `companies_var` and `single_selection` attributes."
    },
    "assign": {
        "description": "The `assign` tag is used to assign a value to a variable. Assigned values are stored as strings and can be manipulated using filters.",
        "example": "{% assign profit = 100 %}\n{{ profit }}\n\n**Output:**\n100",
        "attributes": {
            "description": "Filters can be applied to modify or manipulate assigned values. Available filters include:",
            "string_filters": "remove, replace, upcase, downcase, capitalize, append, prepend, size, strip, string_value, url_encode, url_decode, strip_html, md5, transliterate, newline_to_br, slice, default, allow_false",
            "numeric_filters": "abs, ceil, floor, round, modulo, max, min, at_least, at_most, plus, minus, times, divided_by, currency, invert, integer, percentage, number_to_human, number_to_currency",
            "array_filters": "concat, split, first, last, join, sort, uniq, reverse, map, range, group_by, index_by, where, analytical_code, add_rounding_difference",
            "date_filters": "date, today, localized_date, advance_years, retract_years, advance_months, retract_months, advance_weeks, retract_weeks, advance_days, retract_days, advance_hours, retract_hours, advance_minutes, retract_minutes, advance_seconds, retract_seconds"
        }
    },
    "capture": {
        "description": "The `capture` tag captures the string inside the opening and closing tags and assigns it to a variable. Captured values are stored as strings.",
        "example": "{% capture profit_sentence %}\n  Your profit is {{ profit }}.\n{% endcapture %}\n\n{{ profit_sentence }}\n\n**Output:**\nYour profit is 100."
    },
    "default": {
        "description": "Sets a default value if the variable is nil, false, or empty.",
        "example": `{{ company_form | default:"NV" }}\n\n**Output:**\nNV`
    },
    "remove": {
        "description": "Removes the argument in a given string.",
        "example": `{{ "BE0.524.802.662" | remove:"BE" }}\n\n**Output:**\n0.524.802.662`
    },
    "replace": {
        "description": "Replaces the first argument with the second in a string.",
        "example": `{{ "Comm.VA" | replace:".","" }}\n\n**Output:**\nCommVA`
    },
    "upcase": {
        "description": "Converts all letters in a string to uppercase.",
        "example": `{{ "Silverfin" | upcase }}\n\n**Output:**\nSILVERFIN`
    },
    "downcase": {
        "description": "Converts all letters in a string to lowercase.",
        "example": `{{ "Silverfin" | downcase }}\n\n**Output:**\nsilverfin`
    },
    "capitalize": {
        "description": "Capitalizes the first letter of a string.",
        "example": `{{ "silverfin" | capitalize }}\n\n**Output:**\nSilverfin`
    },
    "append": {
        "description": "Appends a string to the end of another string.",
        "example": `{{ "Tim Vandecasteele" | append:" with a representative" }}\n\n**Output:**\nTim Vandecasteele with a representative`
    },
    "prepend": {
        "description": "Prepends a string to the beginning of another string.",
        "example": `{{ "9050 Ledeberg" | prepend:"B - " }}\n\n**Output:**\nB - 9050 Ledeberg`
    },
    "strip": {
        "description": "Removes leading and trailing whitespace from a string.",
        "example": `{{ "   BE0.524.802.662   " | strip }}\n\n**Output:**\nBE0.524.802.662`
    },
    "string_value": {
        "description": "Forces a value to be treated as a string.",
        "example": `{{ custom.some.field.string_value }}`
    },
    "url_encode": {
        "description": "Encodes a string for use in a URL.",
        "example": `{{ "user@email.com" | url_encode }}\n\n**Output:**\nuser%40email.com`
    },
    "url_decode": {
        "description": "Decodes a URL-encoded string.",
        "example": `{{ "user%40email.com" | url_decode }}\n\n**Output:**\nuser@email.com`
    },
    "strip_html": {
        "description": "Removes HTML tags from a string.",
        "example": `{% capture formatted_text %}This is a <i>text</i>.{% endcapture %}\n{{ formatted_text | strip_html }}\n\n**Output:**\nThis is a text.`
    },
    "md5": {
        "description": "Generates an MD5 hash of a string.",
        "example": `{% assign person_national_number = "920711-216-81" %}\n{{ person_national_number | md5 }}`
    },
    "transliterate": {
        "description": "Converts special characters to their plain-text equivalents.",
        "example": `{{ "éèä" | transliterate }}\n\n**Output:**\neea`
    },
    "allow_false": {
        "description": "Forces a value to be treated as `false` if it is explicitly `false` or `nil`.",
        "example": `{{ custom.some.field | allow_false }}`
    },
    "newline_to_br": {
        "description": "Converts newline characters (`\\n`) in a string to HTML `<br>` tags.",
        "example": `{% assign text = "Line 1\\nLine 2" %}\n{{ text | newline_to_br }}\n\n**Output:**\nLine 1<br>Line 2`
    },
    "slice": {
        "description": "Extracts a substring from a string, starting at the specified index and optionally with a specified length.",
        "example": `{{ "Silverfin" | slice:0,4 }}\n\n**Output:**\nSilv`
    },
    "size": {
        "description": "Returns the size (length) of a string or array.",
        "example": `{{ "Silverfin" | size }}\n\n**Output:**\n9`
    },

    // Numeric Filters
    "at_least": {
        "description": "Ensures a number is at least a specified value.",
        "example": `{{ 4 | at_least:5 }}\n\n**Output:**\n5`
    },
    "at_most": {
        "description": "Ensures a number is at most a specified value.",
        "example": `{{ 4 | at_most:3 }}\n\n**Output:**\n3`
    },
    "number_to_human": {
        "description": "Formats a number in a human-readable format.",
        "example": `{{ 287000 | number_to_human }}\n\n**Output:**\n287 Thousand`
    },
    "number_to_currency": {
        "description": "Formats a number as currency.",
        "example": `{{ "123456789.99" | number_to_currency }}\n\n**Output:**\n123.456.789,99`
    },
    "abs": {
        "description": "Returns the absolute value of a number.",
        "example": `{{ -23 | abs }}\n\n**Output:**\n23`
    },
    "ceil": {
        "description": "Rounds a number up to the nearest whole number.",
        "example": `{{ 1.2222 | ceil:0 }}\n\n**Output:**\n2`
    },
    "floor": {
        "description": "Rounds a number down to the nearest whole number.",
        "example": `{{ 17.8888 | floor:0 }}\n\n**Output:**\n17`
    },
    "round": {
        "description": "Rounds a number to a specified number of decimal places.",
        "example": `{{ 313734.14 | round:0 }}\n\n**Output:**\n313734`
    },
    "modulo": {
        "description": "Returns the remainder of a division operation.",
        "example": `{{ 9 | modulo:2 }}\n\n**Output:**\n1`
    },
    "currency": {
        "description": "Formats a number as currency.",
        "example": `{{ 121590.31 | currency:2 }}\n\n**Output:**\n121,590.31`
    },
    "invert": {
        "description": "Inverts the sign of a number (used with `currency`).",
        "example": `{{ accounts_c | currency:0, invert:true }}`
    },
    "integer": {
        "description": "Formats a number as an integer.",
        "example": `{{ 30.99 | integer }}\n\n**Output:**\n31`
    },
    "percentage": {
        "description": "Formats a number as a percentage.",
        "example": `{{ (#60+#70)/#70 | percentage }}\n\n**Output:**\n99.89%`
    },
    "minus": {
        "description": "Subtracts a number from the input value.",
        "example": `{{ 10 | minus:3 }}\n\n**Output:**\n7`
    },
    "plus": {
        "description": "Adds a number to the input value.",
        "example": `{{ 10 | plus:5 }}\n\n**Output:**\n15`
    },
    "times": {
        "description": "Multiplies the input value by a specified number.",
        "example": `{{ 10 | times:3 }}\n\n**Output:**\n30`
    },
    "divided_by": {
        "description": "Divides the input value by a specified number.",
        "example": `{{ 10 | divided_by:2 }}\n\n**Output:**\n5`
    },
    "max": {
        "description": "Returns the greater of the input value and the specified number.",
        "example": `{{ 4 | max:10 }}\n\n**Output:**\n10`
    },
    "min": {
        "description": "Returns the lesser of the input value and the specified number.",
        "example": `{{ 4 | min:2 }}\n\n**Output:**\n2`
    },

    // Array Filters
    "concat": {
        "description": "Concatenates two arrays.",
        "example": `{% assign fixed_assets = "buildings,land" | split:"," %}\n{% assign intangible_assets = "goodwill,patents" | split:"," %}\n{% assign assets = fixed_assets | concat:intangible_assets %}\n\n**Output:**\nbuildings, land, goodwill, patents`
    },
    "split": {
        "description": "Splits a string into an array.",
        "example": `{% assign used_acc_numbers = "610000;610015" | split:";" %}\n\n**Output:**\n610000, 610015`
    },
    "join": {
        "description": "Joins the elements of an array into a single string, separated by the specified delimiter.",
        "example": `{% assign accounts = "1000,2000,3000" | split:"," %}\n{{ accounts | join:"-" }}\n\n**Output:**\n1000-2000-3000`
    },
    "sort": {
        "description": "Sorts the elements of an array in ascending order.",
        "example": `{% assign numbers = "3,1,2" | split:"," %}\n{{ numbers | sort | join:"," }}\n\n**Output:**\n1,2,3`
    },
    "uniq": {
        "description": "Removes duplicate elements from an array.",
        "example": `{% assign numbers = "1,2,2,3" | split:"," %}\n{{ numbers | uniq | join:"," }}\n\n**Output:**\n1,2,3`
    },
    "reverse": {
        "description": "Reverses the order of elements in an array.",
        "example": `{% assign numbers = "1,2,3" | split:"," %}\n{{ numbers | reverse | join:"," }}\n\n**Output:**\n3,2,1`
    },
    "first": {
        "description": "Returns the first element of an array.",
        "example": `{{ used_acc_numbers | first }}\n\n**Output:**\n610000`
    },
    "last": {
        "description": "Returns the last element of an array.",
        "example": `{{ used_acc_numbers | last }}\n\n**Output:**\n610045`
    },
    "map": {
        "description": "Creates an array by extracting a property from each element in a collection.",
        "example": `{% assign accounts = accounts | map:"name" %}\n\n**Output:**\n[Account1, Account2]`
    },
    "range": {
        "description": "Filters a collection to a specified range.",
        "example": `{% assign filtered_accounts = accounts | range:"1000..2000" %}`
    },
    "group_by": {
        "description": "Groups a collection by a specified property.",
        "example": `{% assign grouped_accounts = accounts | group_by:"category" %}`
    },
    "index_by": {
        "description": "Indexes a collection by a specified property.",
        "example": `{% assign indexed_accounts = accounts | index_by:"id" %}`
    },
    "where": {
        "description": "Filters a collection by a condition.",
        "example": `{% assign active_accounts = accounts | where:"status","active" %}`
    },
    "analytical_code": {
        "description": "Filters a collection of accounts by the specified dimension/company code.",
        "example": `{% assign filtered_accounts = accounts | analytical_code:company.analytical_type_1_codes.code %}`
    },
    "add_rounding_difference": {
        "description": "Shows the rounding difference of a collection of accounts to ensure totals match.",
        "example": `{% assign adjusted_accounts = accounts | add_rounding_difference %}`
    },

    // Date Filters
    "today": {
        "description": "Returns the current date.",
        "example": `{{ "now" | date:"%d/%m/%Y" }}\n\n**Output:**\n06/07/2025`
    },
    "localized_date": {
        "description": "Displays a date according to the user's time zone.",
        "example": `{{ "now" | localized_date:"%d/%m/%Y %H:%M" }}\n\n**Output:**\n06/07/2025 14:30`
    },
    "advance_years": {
        "description": "Advances a date by a specified number of years.",
        "example": `{% assign new_date = "2025-07-06" | advance_years:2 %}\n{{ new_date | date:"%Y" }}\n\n**Output:**\n2027`
    },
    "retract_years": {
        "description": "Retracts a date by a specified number of years.",
        "example": `{% assign new_date = "2025-07-06" | retract_years:2 %}\n{{ new_date | date:"%Y" }}\n\n**Output:**\n2023`
    },
    "advance_months": {
        "description": "Advances a date by a specified number of months.",
        "example": `{% assign new_date = "2025-07-06" | advance_months:2 %}\n{{ new_date | date:"%m/%Y" }}\n\n**Output:**\n09/2025`
    },
    "retract_months": {
        "description": "Retracts a date by a specified number of months.",
        "example": `{% assign new_date = "2025-07-06" | retract_months:2 %}\n{{ new_date | date:"%m/%Y" }}\n\n**Output:**\n05/2025`
    },
    "advance_weeks": {
        "description": "Advances a date by a specified number of weeks.",
        "example": `{% assign new_date = "2025-07-06" | advance_weeks:2 %}\n{{ new_date | date:"%d/%m/%Y" }}\n\n**Output:**\n20/07/2025`
    },
    "retract_weeks": {
        "description": "Retracts a date by a specified number of weeks.",
        "example": `{% assign new_date = "2025-07-06" | retract_weeks:2 %}\n{{ new_date | date:"%d/%m/%Y" }}\n\n**Output:**\n22/06/2025`
    },
    "advance_days": {
        "description": "Advances a date by a specified number of days.",
        "example": `{% assign new_date = "2025-07-06" | advance_days:3 %}\n{{ new_date | date:"%d/%m/%Y" }}\n\n**Output:**\n09/07/2025`
    },
    "retract_days": {
        "description": "Retracts a date by a specified number of days.",
        "example": `{% assign new_date = "2025-07-06" | retract_days:3 %}\n{{ new_date | date:"%d/%m/%Y" }}\n\n**Output:**\n03/07/2025`
    },
    "advance_hours": {
        "description": "Advances a date by a specified number of hours.",
        "example": `{% assign new_date = "2025-07-06 12:00" | advance_hours:3 %}\n{{ new_date | date:"%H:%M" }}\n\n**Output:**\n15:00`
    },
    "retract_hours": {
        "description": "Retracts a date by a specified number of hours.",
        "example": `{% assign new_date = "2025-07-06 12:00" | retract_hours:3 %}\n{{ new_date | date:"%H:%M" }}\n\n**Output:**\n09:00`
    },
    "advance_minutes": {
        "description": "Advances a date by a specified number of minutes.",
        "example": `{% assign new_date = "2025-07-06 12:00" | advance_minutes:30 %}\n{{ new_date | date:"%H:%M" }}\n\n**Output:**\n12:30`
    },
    "retract_minutes": {
        "description": "Retracts a date by a specified number of minutes.",
        "example": `{% assign new_date = "2025-07-06 12:00" | retract_minutes:30 %}\n{{ new_date | date:"%H:%M" }}\n\n**Output:**\n11:30`
    },
    "advance_seconds": {
        "description": "Advances a date by a specified number of seconds.",
        "example": `{% assign new_date = "2025-07-06 12:00:00" | advance_seconds:30 %}\n{{ new_date | date:"%H:%M:%S" }}\n\n**Output:**\n12:00:30`
    },
    "retract_seconds": {
        "description": "Retracts a date by a specified number of seconds.",
        "example": `{% assign new_date = "2025-07-06 12:00:00" | retract_seconds:30 %}\n{{ new_date | date:"%H:%M:%S" }}\n\n**Output:**\n11:59:30`
    },
    "date": {
        "description": "Formats a date according to the specified format string.",
        "example": `{{ "2025-07-06" | date:"%d/%m/%Y" }}\n\n**Output:**\n06/07/2025`,
        "attributes": {
            "format_options": {
                "description": "Available format options for the `date` filter:",
                "options": {
                    "%a": "Abbreviated weekday name (e.g., Sun)",
                    "%A": "Full weekday name (e.g., Sunday)",
                    "%b": "Abbreviated month name (e.g., Jan)",
                    "%B": "Full month name (e.g., January)",
                    "%d": "Day of the month (01..31)",
                    "%-d": "Day of the month (1..31)",
                    "%F": "ISO 8601 date format (e.g., 2021-01-29)",
                    "%H": "Hour (24-hour clock, 00..23)",
                    "%I": "Hour (12-hour clock, 01..12)",
                    "%m": "Month (01..12)",
                    "%M": "Minute (00..59)",
                    "%S": "Second (00..60)",
                    "%Y": "Year with century (e.g., 2025)",
                    "%%": "Literal % character"
                }
            }
        }
    },
    "for": "Creates a loop over a collection. Example:\n`{% for item in collection %}...{% endfor %}`",
    "if": "Creates a conditional block. Example:\n`{% if condition %}...{% endif %}`",
    "case": "Creates a case statement with `when` and `else` conditions.",
    "stripnewlines": "Removes newlines from the enclosed block.",
    "comment": "Adds a comment block. Example:\n`{% comment %} This is a comment {% endcomment %}`",
    "include": "Includes a file from a specified directory. Example:\n`{% include 'shared/filename' %}`"
};