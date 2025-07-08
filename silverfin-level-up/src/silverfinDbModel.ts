// Main Silverfin database model definition
export const silverfinDbModel = {
    // Period-related properties and methods
    'period': {
        // Account mapping configuration
        'account_mapping_list.name': { type: 'string', description: 'The name of the mapping list used for this period (string)' },
        'account_mapping_list.id': { type: 'number', description: 'The id of the mapping list on firm level (integer)' },
        'account_mapping_list.marketplace_template_id': { type: 'number', description: 'The id of the mapping list on the Marketplace (integer)' },

        // Period identification and metadata
        'bookyear_index': { type: 'number', description: 'The index number of the current book year (integer, first year = 1)' },
        'calendar_years': { type: 'array', description: 'Array of all calendar years in the fiscal year (array of objects)' },
        'directors': { type: 'people drop', description: 'All people attached to this period that are directors (people drop)' },
        'end_date': { type: 'date', description: 'The date this period ends (date)' },
        'exists': { type: 'boolean', description: 'Returns true when the period exists in the Silverfin database (boolean)' },
        'fiscal_year': { type: 'string', description: 'The fiscal year of this period (string)' },
        'is_first_year': { type: 'boolean', description: 'Returns true if the period is in the first book year of this client file (boolean)' },
        'month_end_dates': { type: 'array', description: 'Array of all end dates of the calendar months in this fiscal year (array of dates)' },
        'name': { type: 'string', description: 'The name of the period (string)' },
        'shareholders': { type: 'people drop', description: 'All people attached to this period that are shareholders (people drop)' },
        'start_date': { type: 'date', description: 'The date this period starts (date)' },
        'year_end': { type: 'period drop', description: 'The period at the end of the fiscal year this period is in (period drop)' },
        'year_end_date': { type: 'date', description: 'The date of the end of the fiscal year of this period (date)' },
        'year_start_date': { type: 'date', description: 'The date of the start of the fiscal year of this period (date)' },

        // Period navigation - past periods
        'minus_1p': { type: 'period drop', description: 'The period drop of the current period minus 1 period (period drop)' },
        'minus_2p': { type: 'period drop', description: 'The period drop of the current period minus 2 periods (period drop)' },
        'minus_3p': { type: 'period drop', description: 'The period drop of the current period minus 3 periods (period drop)' },
        'minus_1y': { type: 'period drop', description: 'The period drop of the current period minus 1 year (period drop)' },
        'minus_2y': { type: 'period drop', description: 'The period drop of the current period minus 2 years (period drop)' },
        'minus_3y': { type: 'period drop', description: 'The period drop of the current period minus 3 years (period drop)' },

        // Period navigation - future periods
        'plus_1p': { type: 'period drop', description: 'The period drop of the current period plus 1 period (period drop)' },
        'plus_2p': { type: 'period drop', description: 'The period drop of the current period plus 2 periods (period drop)' },
        'plus_3p': { type: 'period drop', description: 'The period drop of the current period plus 3 periods (period drop)' },
        'plus_1y': { type: 'period drop', description: 'The period drop of the current period plus 1 year (period drop)' },
        'plus_2y': { type: 'period drop', description: 'The period drop of the current period plus 2 years (period drop)' },
        'plus_3y': { type: 'period drop', description: 'The period drop of the current period plus 3 years (period drop)' },

        // Accounts collection and filtering methods
        'accounts': Object.assign({
            type: 'accounts drop',
            description: 'A collection of all accounts with bookings on this period (accounts drop)'
        }, {
            'starred': { type: 'accounts drop', description: 'Filters the accounts and returns a new accounts drop with only starred accounts (accounts drop)' },
            'assets': { type: 'accounts drop', description: 'Filters the accounts and returns a new accounts drop with only asset accounts (accounts drop)' },
            'liabilities': { type: 'accounts drop', description: 'Filters the accounts and returns a new accounts drop with only liability accounts (accounts drop)' },
            'revenues': { type: 'accounts drop', description: 'Filters the accounts and returns a new accounts drop with only revenue accounts (accounts drop)' },
            'expenses': { type: 'accounts drop', description: 'Filters the accounts and returns a new accounts drop with only expense accounts (accounts drop)' },
            'income': { type: 'accounts drop', description: 'Filters the accounts and returns a new accounts drop with only income accounts (accounts drop)' },
            'equity': { type: 'accounts drop', description: 'Filters the accounts and returns a new accounts drop with only equity accounts (accounts drop)' },

            // Account aggregation and calculation methods
            'count': { type: 'integer', description: 'The amount of account drops in the accounts drop (integer)' },
            'credit_value': { type: 'decimal', description: 'The sum of all credit values for all accounts in this accounts drop for this period (decimal)' },
            'debit_value': { type: 'decimal', description: 'The sum of all debit values for all accounts in this accounts drop for this period (decimal)' },
            'details': { type: 'details drop', description: 'A details drop of all details of all selected accounts (deprecated, details drop)' },
            'first': { type: 'account drop', description: 'Returns the first account drop of the accounts drop (account drop)' },
            'include_zeros': { type: 'accounts drop', description: 'Returns an accounts drop that includes all accounts, including zero-balance accounts (accounts drop)' },
            'name': { type: 'string', description: 'Returns the name of the first account in this drop (string)' },
            'opening_value': { type: 'decimal', description: 'The sum of all opening values for all accounts in this accounts drop for this period (decimal)' },

            // Rounding difference handling
            'p_and_l_rounding_difference': { type: 'decimal', description: 'Displays the exact P&L rounding difference (decimal)' },
            'bs_rounding_difference': { type: 'decimal', description: 'Displays the exact balance sheet rounding difference (decimal)' },
            'p_and_l_rounding_account': { type: 'accounts drop', description: 'Returns the account drop where the P&L rounding difference is stored (accounts drop)' },
            'bs_rounding_account': { type: 'accounts drop', description: 'Returns the account drop where the balance sheet rounding difference is stored (accounts drop)' },

            // Value display formatting
            'return_values_in_millions': { type: 'accounts drop', description: 'Values of the account drops in the created accounts drop will be shown in millions (accounts drop)' },
            'return_values_in_ones': { type: 'accounts drop', description: 'Values of the account drops in the created accounts drop will be shown in ones (accounts drop)' },
            'return_values_in_thousands': { type: 'accounts drop', description: 'Values of the account drops in the created accounts drop will be shown in thousands (accounts drop)' },
            'value': { type: 'decimal', description: 'The sum of all values for all accounts in this accounts drop for this period (decimal)' },
            'results': { type: 'results drop', description: 'Returns a results drop with all results of the accounts drop (results drop)' },
        }),

        // Individual account access and properties
        'account': Object.assign({
            type: 'account drop',
            description: 'A specific account in this period, accessed by id (account drop)'
        }, {
            "{id}": {
                // Account type identification methods
                'asset?': { type: 'boolean', description: 'Returns true if the account is an asset (boolean)' },
                'asset_or_expense': { type: 'boolean', description: 'Returns true if the account is an asset or an expense (boolean)' },
                'credit_value': { type: 'decimal', description: 'Returns the credit value of the account (decimal)' },
                'custom': { type: 'custom drop', description: 'A way to attach custom information to an account (custom drop)' },
                'debit_value': { type: 'decimal', description: 'Returns the debit value of the account (decimal)' },
                'details': { type: 'details drop', description: 'Returns a details drop with all details of the account (deprecated, details drop)' },
                'equity?': { type: 'boolean', description: 'Returns true if the account is an equity account (boolean)' },
                'expense?': { type: 'boolean', description: 'Returns true if the account is an expense account (boolean)' },
                'id': { type: 'integer', description: 'The unique id for the account (integer)' },
                'income?': { type: 'boolean', description: 'Returns true if the account is an income account (boolean)' },
                'liability?': { type: 'boolean', description: 'Returns true if the account is a liability account (boolean)' },
                'liability_or_income': { type: 'boolean', description: 'Returns true if the account is a liability or an income (boolean)' },

                // Account identification and display
                'link': { type: 'string', description: 'The number and name of the account with a link to the account itself (string with link)' },
                'name': { type: 'string', description: 'The name of the account (string)' },
                'mapped_number': { type: 'string', description: 'The mapped account number (string)' },
                'number': { type: 'string', description: 'The number of the account defined in an account collection (string)' },
                'opening_value': { type: 'decimal', description: 'The opening value of the account (decimal)' },
                'original_name': { type: 'string', description: 'The original name of the account (before mapping) (string)' },
                'original_number': { type: 'string', description: 'The original number of the account (before mapping) (string)' },
                'results': { type: 'results drop', description: 'Returns a results drop with all results of the account (results drop)' },
                'transactions': { type: 'transactions drop', description: 'Returns a transactions drop with all transactions of the account (transactions drop)' },
                'value': { type: 'decimal', description: 'Returns the value of the account in the current period (decimal)' },
                'value_without_adjustments': { type: 'decimal', description: 'Returns the value before adjustments (decimal)' }
            },
        }),

        // Transaction-related properties
        'transaction': Object.assign({
            type: 'transaction drop',
            description: 'A specific transaction in this period (transaction drop)'
        }, {
            'value': { type: 'decimal', description: 'Value of the transaction (decimal)' },
            'date': { type: 'date', description: 'Booking date of the transaction (date)' },
            'relation': { type: 'string', description: 'Name of the relation of the transaction (string)' },
            'account': { type: 'accounts drop', description: 'Access the methods for accounts drops and get the information of the account related to the transaction (accounts drop)' },
            '{field_name}': { type: 'any', description: 'Other fields: The transaction drop provides access to all fields that are stored for transactions. You can access fields other than date, relation or value by calling the name of the column on this drop. Replace spaces and points with underscores.' },
        }),

        // Adjustments collection and filtering
        'adjustments': Object.assign({
            type: 'adjustments drop',
            description: 'All adjustments attached to this period (adjustments drop)'
        }, {
            'count': { type: 'integer', description: 'Returns the amount of adjustment drops (integer)' },
            'external': { type: 'adjustments drop', description: 'Returns an adjustments drop with only the external adjustments (adjustments drop)' },
            'first': { type: 'adjustment drop', description: 'Returns the first adjustment drop of the adjustments drop (adjustment drop)' },
            'internal': { type: 'adjustments drop', description: 'Returns an adjustments drop with only the internal adjustments (adjustments drop)' },
        }),

        // Individual adjustment properties
        'adjustment': Object.assign({
            type: 'adjustment drop',
            description: 'A specific adjustment in this period (adjustment drop)'
        }, {
            'name': { type: 'string', description: 'Name of the adjustment (string)' },
            'period': { type: 'period', description: 'The period this adjustment is in (period)' },
            'transactions': { type: 'array', description: 'Array of items with value, description, and account attributes (array)' },
            'number': { type: 'integer', description: 'The number of the adjustment (integer, numbers of external and internal adjustments can overlap)' },
            'tags': { type: 'array', description: 'Array of items with name attribute (array)' },
            'purpose': { type: 'string', description: 'Purpose of the adjustment (string)' },

            // Adjustment type and origin identification
            'external?': { type: 'boolean', description: 'True when external, false when internal (boolean)' },
            'internal?': { type: 'boolean', description: 'True when internal, false when external (boolean)' },
            'from_reverse?': { type: 'boolean', description: 'True when this adjustment was created by reversing another adjustment (boolean)' },
            'from_forward?': { type: 'boolean', description: 'True when this adjustment was created by forwarding another adjustment (boolean)' },
            'from_copy?': { type: 'boolean', description: 'True when this adjustment was created by copying another adjustment (boolean)' },
            'forward_account': { type: 'accounts drop', description: 'The equity account that was used to do a roll forward (accounts drop)' },
        }),

        // Reconciliations collection and access
        'reconciliations': Object.assign({
            type: 'reconciliations drop',
            description: 'A collection of all reconciliations for this period (reconciliations drop)'
        }, {
            'count': { type: 'integer', description: 'Amount of active reconciliations (integer)' },
            'starred': { type: 'reconciliations drop', description: 'Reconciliations that are marked with a star (reconciliations drop)' },
            '{handle}': { type: 'reconciliation drop', description: 'By using the handle of a reconciliation, that specific reconciliation can be accessed (reconciliation drop)' },
            'results': { type: 'collection', description: 'A collection with the names and values of all result tags. Using the name as a method will return the value (collection)' },
        }),

        // Individual reconciliation properties
        'reconciliation': Object.assign({
            type: 'reconciliation drop',
            description: 'A specific reconciliation for this period, accessed by handle (reconciliation drop)'
        }, {
            "{handle}": {
                'handle': { type: 'string', description: 'The handle of the reconciliation (string)' },
                'hidden?': { type: 'boolean', description: 'Returns true if the reconciliation is hidden; false if the reconciliation is shown (boolean)' },
                'name': { type: 'string', description: 'The name of the reconciliation (string)' },
                'number': { type: 'string', description: 'Returns the virtual account number (string)' },
                'results': { type: 'collection', description: 'A collection with the names and values of all result tags. Using the name as a method will return the value (collection)' },
                'starred?': { type: 'boolean', description: 'Returns true if the reconciliation is starred; returns false if the reconciliation is unstarred (boolean)' },
                'exists?': { type: 'boolean', description: 'Returns true if the reconciliation exists; otherwise it returns false (boolean)' },
                'custom': { type: 'custom drop', description: 'A way to attach custom information to a handle (custom drop)' },
            }
        }),

        // Reports collection and access
        'reports': Object.assign({
            type: 'reports drop',
            description: 'A collection of all reports for this period (reports drop)'
        }, {
            'count': { type: 'integer', description: 'Amount of active reports (integer)' },
            '{handle}': { type: 'report drop', description: 'By using the handle of a report, that specific report can be accessed (report drop)' },
        }),

        'report': Object.assign({
            type: 'report drop',
            description: 'A specific report for this period, accessed by handle (report drop)'
        }, {
            'handle': { type: 'string', description: 'The handle of a report (string)' },
            'name': { type: 'string', description: 'The name of a report (string)' },
            'results': { type: 'collection', description: 'A collection with the names and values of all result tags. Using the name as a method will return the value (collection)' },
        }),

        // People collection and individual person access
        'people': Object.assign({
            type: 'people drop',
            description: 'All people attached to the period (people drop)'
        }, {
            'count': { type: 'integer', description: 'The amount of person drops in the people drop (integer)' },
            'first': { type: 'person drop', description: 'Returns the person drop of the first person in the people drop (person drop)' },
        }),

        'person': Object.assign({
            type: 'person drop',
            description: 'A specific person attached to the period (person drop)'
        }, {
            // Person contact and identification information
            'address_1': { type: 'string', description: 'The first address line (string)' },
            'address_2': { type: 'string', description: 'The second address line (string)' },
            'amount_of_shares': { type: 'integer', description: 'The amount of shares the person has (integer)' },
            'amount_of_votes': { type: 'integer', description: 'The amount of shares the person has (integer)' },
            'custom': { type: 'custom drop', description: 'A way to attach custom information to a person (custom drop)' },

            // Person role and mandate information
            'director': { type: 'boolean', description: 'Returns true if the person is a director (boolean)' },
            'director_end_date': { type: 'date', description: 'The end date of the mandate of the person (date)' },
            'director_start_date': { type: 'date', description: 'The start date of the mandate of the person (date)' },
            'email': { type: 'string', description: 'The email address of the person (string)' },
            'external_id': { type: 'string', description: 'The id from the synchronisation service (string)' },
            'name': { type: 'string', description: 'The name of the person (string)' },
            'persistent_id': { type: 'string', description: 'The unique identifier for the person (string)' },
            'shareholder': { type: 'boolean', description: 'Returns true if the person is a shareholder (boolean)' },
            'statutory': { type: 'boolean', description: 'Returns true if the role is statutory (boolean)' },
        }),

        'custom': { type: 'custom drop', description: 'A way to attach custom information to a period (custom drop)' },
        'company': { type: 'company drop', description: 'The company this period belongs to (company drop)' },
    },

    // Company-related properties and configuration
    'company': {
        // Legacy account mapping (deprecated)
        'account_mapping_list.name': { type: 'string', description: '(deprecated) The name of a mapping list (string)' },
        'account_mapping_list.id': { type: 'string', description: '(deprecated) The id of the mapping list on firm level (string)' },
        'account_mapping_list.marketplace_template_id': { type: 'string', description: '(deprecated) The id of the mapping list on partner level (string)' },
        'analytical_type_{n}_codes': { type: 'drop', description: 'Contains information about dimensions/companies in an analytical/consolidation file (drop)' },

        // Company address and basic information
        'city': { type: 'string', description: 'The city from the company settings (string)' },
        'company_form': { type: 'string', description: 'The company form from the company settings (string)' },
        'company_type': { type: 'string', description: 'The type from the company settings (string)' },
        'country': { type: 'string', description: 'The country from the company settings (string)' },
        'country_code': { type: 'string', description: 'The country code based upon the country from the company settings (string)' },
        'currency': { type: 'string', description: 'The currency code from the company settings (string)' },
        'custom': { type: 'custom drop', description: 'A way to attach custom information to a company (custom drop)' },
        'external_companies': { type: 'drop', description: 'Access data from other companies (drop)' },
        'file_code': { type: 'string', description: 'The file number from the company settings (string)' },

        // Personal file specific fields (feature flagged)
        'first_name': { type: 'string', description: '!Personal files only! (Feature flagged) The first name from the company settings (string)' },
        'last_name': { type: 'string', description: '!Personal files only! (Feature flagged) The last name from the company settings (string)' },
        'locales': { type: 'array', description: 'Available languages for the company (array)' },
        'name': { type: 'string', description: 'The company name from the company settings (string)' },
        'national_insurance_number': { type: 'string', description: '!Personal files only! (Feature flagged) The national insurance number from the company settings (string)' },

        // Company configuration and identification
        'periods_per_year': { type: 'integer', description: 'Returns 1,4,12 depending on the reporting frequency (yearly, quarterly or monthly) (integer)' },
        'postalcode': { type: 'string', description: 'The post code from the company settings (string)' },
        'street': { type: 'string', description: 'The street from the company settings (string)' },
        'vat_identifier': { type: 'string', description: '(deprecated) The VAT identifier from the company settings (string)' },
        'registration_number': { type: 'string', description: 'The company number from the company settings (string)' },
        'vat_number': { type: 'string', description: 'The VAT number from the company settings (string)' },
        people: { type: 'people drop', description: 'All people attached to the company (people drop)' },
    },

    'custom': { type: 'custom drop', description: 'A way to attach custom information to the root (custom drop)' },

    // Export and PDF generation properties
    'export': {
        'title': { type: 'string', description: 'Title of the export bundle (string)' },

        // Table of contents configuration
        'toc': Object.assign({
            type: 'drop',
            description: 'Table of contents information (drop)'
        }, {
            'anchor': { type: 'link', description: 'For linking to the section in the PDF. Use as the target in a liquid link: [{{ toc.number }}](#{{ toc.anchor }}) (link)' },
            'number': { type: 'integer', description: 'Starting page number for the section/block (integer)' },
            'title': { type: 'string', description: 'Name of each export block (i.e. the name of each of the title pages) (string)' },
            'type': { type: 'string', description: 'Returns title_page (when toc_with_title_pages is used) or nil (for the remaining pages) (string)' },
            'until_number': { type: 'string', description: 'Ending page number for the section/block (string)' },
        }),

        'toc_with_title_pages': Object.assign({
            type: 'drop',
            description: 'Table of contents information including the title pages (drop)'
        }, {
            'anchor': { type: 'link', description: 'For linking to the section in the PDF. Use as the target in a liquid link: [{{ toc_with_title_pages.number }}](#{{ toc_with_title_pages.anchor }}) (link)' },
            'number': { type: 'integer', description: 'Starting page number for the section/block (integer)' },
            'title': { type: 'string', description: 'Name of each export block (i.e. the name of each of the title pages) (string)' },
            'type': { type: 'string', description: 'Returns title_page (when toc_with_title_pages is used) or nil (for the remaining pages) (string)' },
            'until_number': { type: 'string', description: 'Ending page number for the section/block (string)' },
        }),

        // Selected accounts and reconciliations for export
        'selected_accounts_and_reconciliation_texts': {
            'accounts': { type: 'accounts drop', description: 'Returns an accounts drop with all the accounts selected on the export (accounts drop)' },

            // Account type filtering for export
            'assets': { type: 'array', description: 'Returns only reconciliations and accounts of type "assets" (array)' },
            'equity': { type: 'array', description: 'Returns only reconciliations and accounts of type "equity" (array)' },
            'empty?': { type: 'boolean', description: 'Returns true if no accounts or reconciliations are selected (boolean)' },
            'expenses': { type: 'array', description: 'Returns only reconciliations and accounts of type "expense" (array)' },
            'incomes': { type: 'array', description: 'Returns only reconciliations and accounts of type "income" (array)' },
            'include_zeros': { type: 'array', description: "Same as the 'include_zeros' method in accounts (array)" },
            'is_account': { type: 'boolean', description: 'Returns true if the selected item is an account (boolean)' },
            'liabilities': { type: 'array', description: 'Returns only reconciliations and accounts of type "liabilities" (array)' },
            'name': { type: 'string', description: 'Returns the account/reconciliation name (string)' },
            'p_and_l': { type: 'array', description: 'Returns only reconciliations and accounts of type "profit and loss" (array)' },
            'reconciliation_texts': { type: 'array', description: 'Returns a reconciliation drop with all the reconciliations selected on the export (array of reconciliation drops)' },
            'rendered_template': { type: 'template', description: 'Prints the selected account/reconciliation template on the PDF export (template)' },
            'unreconciled_value': { type: 'decimal', description: 'Returns the amount pending to be reconciled in the account template (decimal, accounts only)' },
            'value': { type: 'decimal', description: 'Returns the value of the selected account (decimal, accounts only)' },
        },
    },

    // Page information for exports
    'page': {
        'number': { type: 'integer', description: 'Current page number, without counting cover pages (integer)' },
        'total_number': { type: 'integer', description: 'Total number of pages in the whole export PDF, without counting cover pages (integer)' },
    },

    'page_title': {
        'title': { type: 'integer', description: 'Current page number, without counting cover pages (integer)' },
    },

    // Rendering context and mode detection
    'render_configuration': {
        'inputs?': { type: 'boolean', description: 'It returns true in input mode and false in preview/export mode (boolean)' },
        'documents?': { type: 'boolean', description: 'It only returns true in export mode when the attachment option is enabled (paperclip icon in the export page). It returns false in all other scenarios. (boolean)' },
    },

    // Current user information
    'user': {
        'name': { type: 'string', description: 'Name of the Silverfin user (string)' },
        'email': { type: 'string', description: 'Email of the Silverfin user (string)' },
    },

    // Loop iteration context (available within for loops)
    'forloop': {
        'index': { type: 'integer', description: 'The current index of the forloop (starts at 0) (integer)' },
        'index0': { type: 'integer', description: 'The current index of the forloop (starts at 1) (integer)' },
        'length': { type: 'integer', description: 'The total length of the forloop (integer)' },
        'rindex': { type: 'integer', description: 'The reverse index of the forloop (starts at 1) (integer)' },
        'first': { type: 'boolean', description: 'Returns true if this is the first iteration of the forloop (boolean)' },
        'last': { type: 'boolean', description: 'Returns true if this is the last iteration of the forloop (boolean)' },
    }
};