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
        "example": "{% assign profit = 100 %}",
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
        "example": "{% capture profit_sentence %}\n  Your profit is {{ profit }}.\n{% endcapture %}"
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
        "description": "Formats a number as currency. The amount of decimals can be specified with an optional argument (e.g., `currency:2` for two decimals). This can also be configured globally for a template with `currencyconfiguration`.",
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
    "t": {
        "description": "The `t` tag allows you to add translations to your templates, enabling content to be displayed in different languages. You can change the used language with locale tags to override the environment language.",
        "example": `{% t= "expense" nl:"kost" fr:"les frais" en:"expense" %}`,
        "attributes": {
            "Use translations": "Use the `t` tag without equals sign (=) to print the translation.",
            "Defaults": "If a translation is not specified for a language, the tag name acts as the default. You can override this with a `default` translation.",
            "Variables": "Use variables in translations to make parts dynamic. \n**Example:**\n{% t= \"company_info\" en:\"The company {{ company_name }} is in {{ company_city }}\" %}\n{% t \"company_info\" | company_name:company.name company_city:company.city %}"
        }
    },
    "elsif": {
        "description": "The `elsif` statement is used with `if` to check another condition if the `if` condition is false.",
        "example": `{% if profit > 0 %}\n  There's a profit this year.\n{% elsif profit < 0 %}\n  There's a loss this year.\n{% endif %}`
    },
    "if": {
        "description": "The `if` statement checks whether a condition is true or false. If true, the code inside the `if` block is executed. Use `else` or `elsif` for additional conditions. Must be closed with `{% endif %}`.",
        "example": `{% if profit > 0 %}\n  There's a profit this year.\n{% else %}\n  No profit this year.\n{% endif %}`
    },
    "ifi": {
        "description": "The `ifi` statement acts as an `if` statement that is always true in input view and depends on the condition in export view. Use `else` or `elsif` for additional conditions. Must be closed with `{% endifi %}`.",
        "example": `{% ifi supply_change != 0 %}\n  The supplies changed with {{ supply_change }}\n{% else %}\n  No supply change.\n{% endifi %}\n\n**Output (in input view):**\nThe supplies changed with 0.`
    },
    "unless": {
        "description": "The `unless` statement executes code unless the condition is true. Use `else` for additional options. Must be closed with `{% endunless %}`.",
        "example": `{% unless profit > 0 %}\n  There is a loss\n{% else %}\n  There is a profit\n{% endunless %}`
    },
    "case": {
        "description": "The `case` statement compares a variable with multiple values. Use `when` for conditions and `else` for a fallback. Must be closed with `{% endcase %}`.",
        "example": `{% case fiscal_year %}\n{% when 2018 %}\n  {% assign ratio = 0.23 %}\n{% else %}\n  {% assign ratio = 0.19 %}\n{% endcase %}`
    },
    "fori": {
        "description": "The `fori` loop creates custom collections and iterates over them, often used for dynamic inputs. Must be closed with `{% endfori %}`.",
        "example": `{% fori item in custom.the_namespace %}\n  {% input item.some_data %}\n{% endfori %}\n\n**Output:**\nInputs in a fori collection can be filled out using the 'Import reconciliation data' action.`,
        "attributes": {
            "import_title": "Adds a title to distinguish between multiple `fori` collections when importing data.",
            "limit": "Limits the number of iterations in the `fori` loop.\n\nExample:\n{% fori item in custom.the_namespace limit:3 %}\n  {% input item.some_data %}\n{% endfori %}",
            "offset": "Starts the `fori` loop at a specific index.\n\nExample:\n{% fori item in custom.the_namespace offset:2 %}\n  {% input item.some_data %}\n{% endfori %}",
            "reversed": "Reverses the order of the `fori` loop.\n\nExample:\n{% fori item in custom.the_namespace reversed %}\n  {% input item.some_data %}\n{% endfori %}"
        }
    },
    "for": {
        "description": "The `for` loop iterates over collections, arrays, or ranges of numbers, executing code repeatedly for each item. Must be closed with `{% endfor %}`.",
        "example": `{% for item in custom.the_namespace %}\n  {{ item.some_data }}\n{% endfor %}\n\n**Output:**\nPrints all variables in the custom collection.`,
        "attributes": {
            "range": "Defines a range of numbers to loop through.\n\nExample:\n{% for i in (1..5) %}\n  {{ i }}\n{% endfor %}\n\n**Output:**\n1\n2\n3\n4\n5",
            "helper_variables": "Provides helper variables like `forloop.index`, `forloop.index0`, `forloop.rindex`, `forloop.length`, `forloop.first`, and `forloop.last`.",
            "limit": "Limits the number of iterations in the loop.\n\nExample:\n{% for i in (1..10) limit:3 %}\n  {{ i }}\n{% endfor %}\n\n**Output:**\n1\n2\n3",
            "offset": "Starts the loop at a specific index.\n\nExample:\n{% for i in (1..5) offset:2 %}\n  {{ i }}\n{% endfor %}\n\n**Output:**\n3\n4\n5",
            "reversed": "Reverses the order of the loop.\n\nExample:\n{% for i in (1..5) reversed %}\n  {{ i }}\n{% endfor %}\n\n**Output:**\n5\n4\n3\n2\n1"
        }
    },
    "forloop.index": {
        "description": "Returns the current iteration index (1-based).",
        "example": `{% for i in (1..3) %}\n  {{ forloop.index }}\n{% endfor %}\n\n**Output:**\n1\n2\n3`
    },
    "forloop.index0": {
        "description": "Returns the current iteration index (0-based).",
        "example": `{% for i in (1..3) %}\n  {{ forloop.index0 }}\n{% endfor %}\n\n**Output:**\n0\n1\n2`
    },
    "forloop.rindex": {
        "description": "Returns the reverse index of the current iteration (1-based).",
        "example": `{% for i in (1..3) %}\n  {{ forloop.rindex }}\n{% endfor %}\n\n**Output:**\n3\n2\n1`
    },
    "forloop.length": {
        "description": "Returns the total number of iterations in the loop.",
        "example": `{% for i in (1..3) %}\n  {{ forloop.length }}\n{% endfor %}\n\n**Output:**\n3\n3\n3`
    },
    "forloop.first": {
        "description": "Returns `true` if the current iteration is the first.",
        "example": `{% for i in (1..3) %}\n  {{ forloop.first }}\n{% endfor %}\n\n**Output:**\ntrue\nfalse\nfalse`
    },
    "forloop.last": {
        "description": "Returns `true` if the current iteration is the last.",
        "example": `{% for i in (1..3) %}\n  {{ forloop.last }}\n{% endfor %}\n\n**Output:**\nfalse\nfalse\ntrue`
    },
    "break": {
        "description": "The `break` tag causes the loop to stop iterating when it encounters the `break` tag.",
        "example": `{% assign numbers = "1;2;3;4;5" | split:";" %}\n\n{% for item in numbers %}\n  {{ item }}\n  {% if INT(item) > 2 %}\n    {% break %}\n  {% endif %}\n{% endfor %}\n\n**Output:**\n1\n2\n3`
    },
    "continue": {
        "description": "The `continue` tag causes the loop to skip the current iteration when it encounters the `continue` tag.",
        "example": `{% assign numbers = "1;2;3;4" | split:";" %}\n\n{% for item in numbers %}\n  {% if INT(item) == 2 %}\n    {% continue %}\n  {% else %}\n    {{ item }}\n  {% endif %}\n{% endfor %}\n\n**Output:**\n1\n3\n4`
    },
    "limit": {
        "description": "The `limit` attribute allows you to exit the `for` loop at a specific index.",
        "example": `{% input custom.numberOfMonths.perPeriod as:select options:"1|2|3|4|5|6|7|8|9|10|11|12" default:"12" %}\n{% assign numberOfMonths = custom.numberOfMonths.perPeriod | default:12 %}\n\n{% for month in period.month_end_dates limit:INT(numberOfMonths) %}\n  **_{{ month | date:'%m/%Y'}}_**\n{% endfor %}`
    },
    "offset": {
        "description": "The `offset` attribute allows you to start the `for` loop at a specific index.",
        "example": `{% assign numbers = "1;2;3;4;5" | split:";" %}\n\n{% for item in numbers offset:2 %}\n  {{ item }}\n{% endfor %}\n\n**Output:**\n3\n4\n5`
    },
    "reversed": {
        "description": "The `reversed` attribute allows you to reverse the order of the loop.",
        "example": `{% assign numbers = "1;2;3;4;5" | split:";" %}\n\n{% for item in numbers reversed %}\n  {{ item }}\n{% endfor %}\n\n**Output:**\n5\n4\n3\n2\n1`
    },

    
    "ABS": {
        "description": "Returns the absolute value of a number.",
        "example": `ABS(-23) \n\n**Output:**\n23`
    },
    "INT": {
        "description": "Returns the integer value of a number.",
        "example": `INT(-23,5555) \n\n**Output:**\n-23`
    },

    "unreconciled": {
        "description": "The `unreconciled` tag is used to indicate whether a template (account or reconciliation template) is reconciled. It evaluates a formula and determines if the result is zero (reconciled) or non-zero (unreconciled).",
        "example": `{% assign income_accounts_total = period.accounts | range:"70" %}\n{% unreconciled -income_accounts_total-table_total %}`,
        "attributes": {
            "as": "Displays the reconciliation status as an indicator. Use `as:indicator` to show a green dot (reconciled) or a red triangle (unreconciled).",
            "unreconciled_text": "Adds a string of text to explain the difference when the indicator is unreconciled.\n\nExample:\n{% unreconciled -income_accounts_total-table_total as:indicator unreconciled_text:'Difference explanation' %}"
        }
    },
    "result": {
        "description": "The `result` tag is used to reference values across templates. It allows you to store a value in one template and access it in another.",
        "example": `{% result "tax_calculation" $1 %}`,
        "attributes": {
            "usage": "Defines a result with a unique name and content. Example:\n{% result \"name\" content %}",
            "loop_usage": "Result tags can be used in loops. To ensure proper functionality, remove quotes around the name in each iteration. Example:\n{% result name content %}",
            "accessing_results": "Access a result from another template using its handle. Example:\n{{ period.reconciliations.template_a.results.tax_calculation }}"
        }
    },
    "rollforward": {
        "description": "The `rollforward` tag is used to copy data from one period to another, transferring values between database variables across periods.",
        "example": `{% rollforward custom.depreciation.passed custom.depreciation.current %}`,
        "attributes": {
            "rollforward.period": "Checks the period to which data is being copied. Useful for conditional operations.",
            "as:file": "Ensures files are copied, removed, or replaced correctly during rollforward operations."
        }
    },
    "locale": {
        "description": "The `locale` tag forces the content of a template to follow a specific language, overriding the user's chosen language. It also influences currency formatting within the locale tags.",
        "example": `{% locale "nl" %}\n  {% t "Hello" %}\n{% endlocale %}`,
        "attributes": {
            "currency_formatting": "The `locale` tag also affects currency formatting, adapting it to the specified language."
        }
    },
    "include": {
        "description": "The `include` tag allows you to access and execute code stored in parts or shared parts. It helps organize and reuse code across templates.",
        "example": `{% include "parts/name_of_a_part" %}`,
        "attributes": {
            "parts": "Parts are sections of code stored within a template. The main part is always loaded first, while additional parts are loaded only when called using the `include` tag.",
            "shared_parts": "Shared parts are reusable code snippets that can be used across multiple templates. They must be activated in your firm and are executed within the template where they are included.",
            "parameters": "You can pass parameters or variables to included parts or shared parts for modular and reusable code."
        }
    },
    "linkto": {
        "description": "The `linkto` tag creates a link that lets you jump to another template, section, or external URL.",
        "example": `{% linkto period.reconciliations.benefit_in_kind %}Link to template{% endlinkto %}`,
        "attributes": {
            "target": "Defines a specific section in the target template to jump to.",
            "account": "Creates a link to a specific account.",
            "external_link": "Creates a link to an external URL.",
            "as:button": "Turns the link into a clickable button.",
            "new_tab": "Opens the link in a new browser tab."
        }
    },
    "adjustmentbutton": {
        "description": "The `adjustmentbutton` tag is used to create a button that automatically makes an adjustment, filled with values taken from Liquid logic.",
        "example": `{% adjustmentbutton text:"create new adjustment" category:"internal" %}\n{% adjustmenttransaction account_number:"100000" description:"Some description" value:1000.23 %}\n{% endadjustmentbutton %}`,
        "attributes": {
            "purpose": "Allows creating an adjustment that belongs to a unique purpose.",
            "analytical_dimension_1_id": "Specifies an analytical dimension or consolidation file for the adjustment."
        }
    },
    "adjustmenttransaction": {
        "description": "The `adjustmenttransaction` tag is used within an `adjustmentbutton` to define individual transactions.",
        "example": `{% adjustmenttransaction account_number:"100000" description:"Some description" value:1000.23 %}`,
        "attributes": {
            "account_number": "Specifies the account number for the transaction.",
            "description": "Provides a description for the transaction.",
            "value": "Defines the value of the transaction."
        }
    },
    "::group": {
        "description": "The `group` tag is used to group certain parts of the text in the Silverfin templating language, ensuring that they remain on the same page in export view.",
        "example": `{% nic %}\n{::group}\nContent to group\n{:/group}\n{% endnic %}`,
        "attributes": {
            "usage_in_text_templates": "For text templates, open and close the `group` tag to group content.",
            "restrictions": "The `group` tags cannot be used within `stripnewlines`."
        }
    },
    "addnewinputs": {
        "description": "The `addnewinputs` tag is used to sort your custom collection in Silverfin templating language.",
        "example": `{% addnewinputs %}\n  {% assign investments = custom.investments_office_material | sort:\"investment_date\" %}\n{% endaddnewinputs %}`
    },
    "signmarker": {
        "description": "The `signmarker` tag is used to integrate with third-party digital signing services, allowing documents to be signed digitally.",
        "example": `{% signmarker name:auditor_name email:auditor_email role:auditor_role %}`,
        "attributes": {
            "name": "Specifies the name of the signer.",
            "email": "Specifies the email address of the signer.",
            "phone": "Specifies the phone number of the signer.",
            "role": "Specifies the role of the signer (e.g., auditor, manager).",
            "on_behalf_of": "Specifies if the signer is signing on behalf of someone else."
        }
    },
    "push": {
        "description": "The `push` tag adds an item to an array in Silverfin templates. By default, it appends the item to the end of the array (LIFO logic).",
        "example": `{% push "Land" to:asset_categories_array %}`,
        "attributes": {
            "to": "Specifies the array to which the item will be added.",
            "at:beginning": "Overrides the default LIFO behavior and inserts the item at the beginning of the array.\n\nExample:\n{% push \"Land\" to:asset_categories_array at:beginning %}"
        }
    },
    "pop": {
        "description": "The `pop` tag removes the last item from an array and optionally stores it in a variable. By default, it removes the last item (LIFO logic).",
        "example": `{% pop asset_categories_array to:new_assets_categories_array %}`,
        "attributes": {
            "to": "Specifies the variable where the removed item will be stored.",
            "at:beginning": "Overrides the default LIFO behavior and removes the first item from the array.\n\nExample:\n{% pop asset_categories_array to:new_assets_categories_array at:beginning %}"
        }
    },
    "changeorientation": {
        "description": "The `changeorientation` tag allows you to change the orientation of the page in PDF exports.",
        "example": `{% changeorientation "landscape" %}\n\n{% changeorientation "portrait" %}`,
        "attributes": {
            "orientation": "Specifies the orientation of the page. Options are:\n- **landscape**\n- **portrait**"
        }
    },
    "currencyconfiguration": {
        "description": "The `currencyconfiguration` tag is used to configure the formatting of the `currency` filter within a template, overriding firm/locale-level settings.",
        "example": `{% currencyconfiguration negative_format:"-xxx" zero_format:"0" precision:3 delimiter:" " separator:"," %}\n{% endcurrencyconfiguration %}`,
        "attributes": {
            "zero_format": "Defines how zero values are displayed. Options: `0`, `-`.",
            "negative_format": "Defines how negative values are displayed. Options: `-xxx`, `(xxx)`.",
            "precision": "Specifies the number of decimal places. Any whole number is allowed.",
            "delimiter": "Defines the thousands delimiter. Options: `,`, `.`, `''` (no space), `' '` (space).",
            "separator": "Defines the decimal separator. Options: `,`, `.`."
        }
    },
    "newpage": {
        "description": "The `newpage` tag generates page breaks in PDF exports. It is ignored in input and preview screens.",
        "example": `{% newpage %}`,
        "attributes": {
            "preferred_orientation": "Defines the page orientation for the new page. Options are:\n- **landscape**\n- **portrait**.",
            "section_break": "Adds a visual split between pages in input mode without creating new pages in the PDF export."
        }
    },
    "radiogroup": {
        "description": "The `radiogroup` tag allows you to create radio buttons in Silverfin templates. It is used to present multiple options where only one can be selected.",
        "example": `{% radiogroup custom.music.fav_genre default:"pop" %}\n  {% radioinput label:"Pop" value:"pop" %}\n  {% radioinput label:"Jazz" value:"jazz" %}\n{% endradiogroup %}`,
        "attributes": {
            "required": "Makes the radiogroup mandatory. The user must select an option before proceeding.",
            "default": "Sets a default value for the radiogroup. The default value is visually selected but not stored in the database unless the user confirms it.",
            "import_title": "Adds a title to distinguish between multiple radiogroups when importing data."
        }
    },
    "radioinput": {
        "description": "The `radioinput` tag defines individual radio buttons within a `radiogroup`. Each `radioinput` must have a unique value within the same group.",
        "example": `{% radiogroup custom.music.instrument %}\n  {% radioinput label:"Piano" value:"piano" %}\n  {% radioinput value:"guitar" %}\n{% endradiogroup %}`,
        "attributes": {
            "label": "Defines the text displayed next to the radio button. If no label is provided, the value will be displayed instead.",
            "value": "Specifies the value stored in the template when the radio button is selected."
        }
    },
    "input_validation": {
        "description": "The `input_validation` tag allows you to validate data entered into inputs, ensuring it meets specific criteria without requiring additional checks.",
        "example": `{% input_validation 'validation_positive_values' as:numeric min:0 %}`,
        "attributes": {
            "as": "Specifies the type of validation. Options include:\n- **numeric**: For numeric inputs (e.g., integers, currency).\n- **date**: For date inputs.",
            "min": "Defines the minimum value for numeric inputs.",
            "max": "Defines the maximum value for numeric inputs.",
            "start_date": "Specifies the earliest allowed date for date inputs.",
            "end_date": "Specifies the latest allowed date for date inputs."
        }
    },
    "validation": {
        "description": "The `validation` attribute is used in input tags to apply a predefined input validation.",
        "example": `{% input custom.depreciation.value as:currency placeholder:0 validation:validation_positive_values %}`,
        "attributes": {
            "validation_name": "References the name of the predefined input validation to apply.\n\nExample:\n{% input custom.depreciation.value as:currency validation:validation_positive_values %}"
        }
    },
    "class": {
        "description": "CSS classes for HTML tables in Silverfin. Apply to <table>, <thead>, <th>, or <td> as noted.",
        "attributes": {
            "`<table>` only": "usr-bordered, usr-line-(top,bottom,left,right), usr-double-line-(top,bottom,left,right), usr-width-1 ... usr-width-100",
            "`<thead>` only": "usr-repeated-header, usr-hide-samepage-header",
            "`<th>, <td>` only": "usr-align-(left,center,right,justify), usr-valign-(top,center,bottom), usr-width-1 ... usr-width-100, usr-line-(top,bottom,left,right), usr-double-line-(top,bottom,left,right), usr-border-color-<hex>, usr-background-color-<hex>, usr-indent-1 ... usr-indent-10, usr-grayed-out-background-input, usr-grayed-out-line-bottom-input"
        }
    }
};