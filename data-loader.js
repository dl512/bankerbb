/**
 * Data Loader - Loads data from JSON file
 * This replaces the need for data.js
 */

let MILESTONE_TYPES = {};
let STATUS_MILESTONES = [];
let COMPANIES_DATA = [];

// Convert date strings to Date objects
function convertDates(company) {
    // Convert founded date
    if (company.founded && typeof company.founded === 'string') {
        company.founded = new Date(company.founded);
    }
    
    // Convert milestone dates
    if (company.milestones) {
        company.milestones.forEach(milestone => {
            if (milestone.date && typeof milestone.date === 'string') {
                milestone.date = new Date(milestone.date);
            }
        });
    }
    
    return company;
}

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`Failed to load data.json: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        MILESTONE_TYPES = data.milestone_types || {};
        STATUS_MILESTONES = data.status_milestones || [];
        COMPANIES_DATA = (data.companies || []).map(convertDates);
        
        console.log('Data loaded successfully:', {
            milestoneTypes: Object.keys(MILESTONE_TYPES).length,
            companies: COMPANIES_DATA.length
        });
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback: try to use data.js if it exists
        if (typeof COMPANIES_DATA !== 'undefined') {
            console.log('Using fallback data.js');
        } else {
            throw error;
        }
    }
}

// Initialize data loading
loadData();

