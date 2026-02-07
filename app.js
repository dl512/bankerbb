/**
 * Application Logic - Two Section Layout
 * 
 * Section 1: Companies - Shows company status and information
 * Section 2: Transactions - Shows all milestone events in timeline
 * 
 * Status vs Transactions:
 * - Status: Current company stage (latest private round OR IPO stages if public)
 * - Transactions: All milestone events (funding rounds, IPO stages, follow-on, debt, etc.)
 * 
 * Note: STATUS_MILESTONES is defined in data.js (loaded before this file)
 */

class FinanceDashboard {
    constructor() {
        // Wait for data to load if using JSON
        if (typeof COMPANIES_DATA === 'undefined' || COMPANIES_DATA.length === 0) {
            // Data is loading asynchronously, wait a bit
            setTimeout(() => {
                if (typeof COMPANIES_DATA !== 'undefined' && COMPANIES_DATA.length > 0) {
                    this.initialize();
                } else {
                    console.error('Data not loaded. Make sure data.json exists or data.js is loaded.');
                }
            }, 100);
            return;
        }
        this.initialize();
    }
    
    // Unified currency formatter - uses M or B, max 1 decimal place
    formatCurrency(value) {
        if (value === null || value === undefined || value === 0) {
            return 'N/A';
        }
        
        const absValue = Math.abs(value);
        const isNegative = value < 0;
        
        // Convert to billions if >= 1000, otherwise millions
        if (absValue >= 1000) {
            const billions = absValue / 1000;
            // Format to max 1 decimal place
            const formatted = billions % 1 === 0 
                ? billions.toFixed(0) 
                : billions.toFixed(1).replace(/\.?0+$/, '');
            return `${isNegative ? '-' : ''}$${formatted}B`;
        } else {
            // Format to max 1 decimal place
            const formatted = absValue % 1 === 0 
                ? absValue.toFixed(0) 
                : absValue.toFixed(1).replace(/\.?0+$/, '');
            return `${isNegative ? '-' : ''}$${formatted}M`;
        }
    }
    
    initialize() {
        this.companies = COMPANIES_DATA;
        
        // Separate filters for companies and transactions
        this.companyFilters = {
            types: ['private', 'public'],
            industries: [],
            selectedCompanyIds: []
        };
        
        this.transactionFilters = {
            types: ['private', 'public'],
            industries: [],
            selectedCompanyIds: [],
            transactionTypes: [], // Filter by milestone types
            dateRange: {
                start: new Date(2010, 0, 1),
                end: new Date(2025, 11, 31)
            }
        };
        
        this.filteredCompanies = [];
        this.filteredTransactions = [];
        
        this.init();
    }
    
    initialize() {
        this.companies = COMPANIES_DATA;
        
        // Separate filters for companies and transactions
        this.companyFilters = {
            types: ['private', 'public'],
            industries: [],
            selectedCompanyIds: []
        };
        
        this.transactionFilters = {
            types: ['private', 'public'],
            industries: [],
            selectedCompanyIds: [],
            transactionTypes: [], // Filter by milestone types
            dateRange: {
                start: new Date(2010, 0, 1),
                end: new Date(2025, 11, 31)
            }
        };
        
        this.filteredCompanies = [];
        this.filteredTransactions = [];
        
        this.init();
    }

    init() {
        // Set default date range for transactions based on actual data
        // Fallback to a broad range if no milestones found
        let startDate = new Date(2010, 0, 1);
        let endDate = new Date(2030, 11, 31);

        const allDates = [];
        this.companies.forEach(company => {
            (company.milestones || []).forEach(milestone => {
                if (milestone.date) {
                    const d = new Date(milestone.date);
                    if (!isNaN(d)) {
                        allDates.push(d);
                    }
                }
            });
        });

        if (allDates.length > 0) {
            const minTime = Math.min(...allDates.map(d => d.getTime()));
            const maxTime = Math.max(...allDates.map(d => d.getTime()));
            startDate = new Date(minTime);
            endDate = new Date(maxTime);

            // Add a little padding on the range for nicer UX
            startDate.setFullYear(startDate.getFullYear() - 1);
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        
        const formatDateForInput = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const transactionDateStart = document.getElementById('transaction-date-start');
        const transactionDateEnd = document.getElementById('transaction-date-end');
        
        if (transactionDateStart && transactionDateEnd) {
            transactionDateStart.value = formatDateForInput(startDate);
            transactionDateEnd.value = formatDateForInput(endDate);
        }
        
        this.transactionFilters.dateRange.start = startDate;
        this.transactionFilters.dateRange.end = endDate;
        
        this.setupEventListeners();
        this.renderFilters();
        this.applyCompanyFilters();
        this.applyTransactionFilters();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Company section filters
        const companyPrivateFilter = document.getElementById('company-filter-private');
        const companyPublicFilter = document.getElementById('company-filter-public');
        
        if (companyPrivateFilter) {
            companyPrivateFilter.addEventListener('change', (e) => {
                this.toggleCompanyFilter('types', 'private', e.target.checked);
            });
        }
        
        if (companyPublicFilter) {
            companyPublicFilter.addEventListener('change', (e) => {
                this.toggleCompanyFilter('types', 'public', e.target.checked);
            });
        }

        // Transaction section filters
        const transactionPrivateFilter = document.getElementById('transaction-filter-private');
        const transactionPublicFilter = document.getElementById('transaction-filter-public');
        
        if (transactionPrivateFilter) {
            transactionPrivateFilter.addEventListener('change', (e) => {
                this.toggleTransactionFilter('types', 'private', e.target.checked);
            });
        }
        
        if (transactionPublicFilter) {
            transactionPublicFilter.addEventListener('change', (e) => {
                this.toggleTransactionFilter('types', 'public', e.target.checked);
            });
        }

        // Transaction date range filters
        const transactionDateStart = document.getElementById('transaction-date-start');
        const transactionDateEnd = document.getElementById('transaction-date-end');
        
        if (transactionDateStart) {
            transactionDateStart.addEventListener('change', (e) => {
                this.transactionFilters.dateRange.start = new Date(e.target.value);
                this.applyTransactionFilters();
            });
        }
        
        if (transactionDateEnd) {
            transactionDateEnd.addEventListener('change', (e) => {
                this.transactionFilters.dateRange.end = new Date(e.target.value);
                this.applyTransactionFilters();
            });
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === `tab-${tabName}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    toggleCompanyFilter(category, value, checked) {
        if (category === 'types') {
            if (checked) {
                if (!this.companyFilters.types.includes(value)) {
                    this.companyFilters.types.push(value);
                }
            } else {
                this.companyFilters.types = this.companyFilters.types.filter(t => t !== value);
            }
        } else if (category === 'industries') {
            if (checked) {
                if (!this.companyFilters.industries.includes(value)) {
                    this.companyFilters.industries.push(value);
                }
            } else {
                this.companyFilters.industries = this.companyFilters.industries.filter(i => i !== value);
            }
        } else if (category === 'companies') {
            if (checked) {
                if (!this.companyFilters.selectedCompanyIds.includes(value)) {
                    this.companyFilters.selectedCompanyIds.push(value);
                }
            } else {
                this.companyFilters.selectedCompanyIds = this.companyFilters.selectedCompanyIds.filter(id => id !== value);
            }
        }
        this.applyCompanyFilters();
    }

    toggleTransactionFilter(category, value, checked) {
        if (category === 'types') {
            if (checked) {
                if (!this.transactionFilters.types.includes(value)) {
                    this.transactionFilters.types.push(value);
                }
            } else {
                this.transactionFilters.types = this.transactionFilters.types.filter(t => t !== value);
            }
        } else if (category === 'industries') {
            if (checked) {
                if (!this.transactionFilters.industries.includes(value)) {
                    this.transactionFilters.industries.push(value);
                }
            } else {
                this.transactionFilters.industries = this.transactionFilters.industries.filter(i => i !== value);
            }
        } else if (category === 'companies') {
            if (checked) {
                if (!this.transactionFilters.selectedCompanyIds.includes(value)) {
                    this.transactionFilters.selectedCompanyIds.push(value);
                }
            } else {
                this.transactionFilters.selectedCompanyIds = this.transactionFilters.selectedCompanyIds.filter(id => id !== value);
            }
        } else if (category === 'transactionTypes') {
            if (checked) {
                if (!this.transactionFilters.transactionTypes.includes(value)) {
                    this.transactionFilters.transactionTypes.push(value);
                }
            } else {
                this.transactionFilters.transactionTypes = this.transactionFilters.transactionTypes.filter(t => t !== value);
            }
        }
        this.applyTransactionFilters();
    }

    renderFilters() {
        // Get unique industries
        const industries = [...new Set(this.companies.map(c => c.industry))].sort();
        
        // Render company section industry filters
        const companyIndustryContainer = document.getElementById('company-industry-filters');
        if (companyIndustryContainer) {
            companyIndustryContainer.innerHTML = industries.map(industry => `
                <label class="checkbox-label">
                    <input type="checkbox" data-industry="${industry}" class="company-industry-filter" checked>
                    <span>${industry}</span>
                </label>
            `).join('');

            companyIndustryContainer.querySelectorAll('.company-industry-filter').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const industry = e.target.dataset.industry;
                    this.toggleCompanyFilter('industries', industry, e.target.checked);
                });
            });
        }

        // Render company selector for company section
        const companySelectorContainer = document.getElementById('company-selector');
        if (companySelectorContainer) {
            companySelectorContainer.innerHTML = `
                <label class="checkbox-label">
                    <input type="checkbox" id="company-select-all" checked>
                    <span class="font-medium">All Companies</span>
                </label>
                ${this.companies.map(company => `
                    <label class="checkbox-label">
                        <input type="checkbox" data-company-id="${company.id}" class="company-filter-checkbox" checked>
                        <span>${company.name}${company.ticker ? ` (${company.ticker})` : ''}
                            <span class="company-badge ${company.type}">${company.type}</span>
                        </span>
                    </label>
                `).join('')}
            `;

            const selectAllCompanies = document.getElementById('company-select-all');
            if (selectAllCompanies) {
                selectAllCompanies.addEventListener('change', (e) => {
                    const checked = e.target.checked;
                    this.companyFilters.selectedCompanyIds = checked ? [] : this.companies.map(c => c.id);
                    companySelectorContainer.querySelectorAll('.company-filter-checkbox').forEach(cb => {
                        cb.checked = checked;
                    });
                    this.applyCompanyFilters();
                });
            }

            companySelectorContainer.querySelectorAll('.company-filter-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const companyId = e.target.dataset.companyId;
                    this.toggleCompanyFilter('companies', companyId, e.target.checked);
                    this.updateCompanySelectAllState();
                });
            });
        }

        // Render transaction section industry filters
        const transactionIndustryContainer = document.getElementById('transaction-industry-filters');
        if (transactionIndustryContainer) {
            transactionIndustryContainer.innerHTML = industries.map(industry => `
                <label class="checkbox-label">
                    <input type="checkbox" data-industry="${industry}" class="transaction-industry-filter" checked>
                    <span>${industry}</span>
                </label>
            `).join('');

            transactionIndustryContainer.querySelectorAll('.transaction-industry-filter').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const industry = e.target.dataset.industry;
                    this.toggleTransactionFilter('industries', industry, e.target.checked);
                });
            });
        }

        // Render transaction type filters
        const transactionTypeContainer = document.getElementById('transaction-type-filters');
        if (transactionTypeContainer) {
            transactionTypeContainer.innerHTML = Object.entries(MILESTONE_TYPES).map(([type, info]) => `
                <label class="checkbox-label">
                    <input type="checkbox" data-transaction-type="${type}" class="transaction-type-filter" checked>
                    <span>${info.label}</span>
                </label>
            `).join('');

            transactionTypeContainer.querySelectorAll('.transaction-type-filter').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const transactionType = e.target.dataset.transactionType;
                    this.toggleTransactionFilter('transactionTypes', transactionType, e.target.checked);
                });
            });
        }

        // Render company selector for transaction section
        const transactionCompanySelector = document.getElementById('transaction-company-selector');
        if (transactionCompanySelector) {
            transactionCompanySelector.innerHTML = `
                <label class="checkbox-label">
                    <input type="checkbox" id="transaction-select-all" checked>
                    <span class="font-medium">All Companies</span>
                </label>
                ${this.companies.map(company => `
                    <label class="checkbox-label">
                        <input type="checkbox" data-company-id="${company.id}" class="transaction-company-filter-checkbox" checked>
                        <span>${company.name}${company.ticker ? ` (${company.ticker})` : ''}
                            <span class="company-badge ${company.type}">${company.type}</span>
                        </span>
                    </label>
                `).join('')}
            `;

            const selectAllTransactions = document.getElementById('transaction-select-all');
            if (selectAllTransactions) {
                selectAllTransactions.addEventListener('change', (e) => {
                    const checked = e.target.checked;
                    this.transactionFilters.selectedCompanyIds = checked ? [] : this.companies.map(c => c.id);
                    transactionCompanySelector.querySelectorAll('.transaction-company-filter-checkbox').forEach(cb => {
                        cb.checked = checked;
                    });
                    this.applyTransactionFilters();
                });
            }

            transactionCompanySelector.querySelectorAll('.transaction-company-filter-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const companyId = e.target.dataset.companyId;
                    this.toggleTransactionFilter('companies', companyId, e.target.checked);
                    this.updateTransactionSelectAllState();
                });
            });
        }
    }

    updateCompanySelectAllState() {
        const selectAll = document.getElementById('company-select-all');
        if (selectAll) {
            selectAll.checked = this.companyFilters.selectedCompanyIds.length === 0;
        }
        const count = this.companyFilters.selectedCompanyIds.length;
        const countElement = document.getElementById('company-selected-count');
        if (countElement) {
            countElement.textContent = count === 0 ? 'All' : count.toString();
        }
    }

    updateTransactionSelectAllState() {
        const selectAll = document.getElementById('transaction-select-all');
        if (selectAll) {
            selectAll.checked = this.transactionFilters.selectedCompanyIds.length === 0;
        }
        const count = this.transactionFilters.selectedCompanyIds.length;
        const countElement = document.getElementById('transaction-selected-count');
        if (countElement) {
            countElement.textContent = count === 0 ? 'All' : count.toString();
        }
    }

    applyCompanyFilters() {
        this.filteredCompanies = this.companies.filter(company => {
            // Filter by type
            if (!this.companyFilters.types.includes(company.type)) return false;

            // Filter by industry
            if (this.companyFilters.industries.length > 0 && 
                !this.companyFilters.industries.includes(company.industry)) {
                return false;
            }

            // Filter by selected companies
            if (this.companyFilters.selectedCompanyIds.length > 0 && 
                !this.companyFilters.selectedCompanyIds.includes(company.id)) {
                return false;
            }

            return true;
        });

        this.updateCompanyStats();
        this.renderCompaniesTable();
        this.updateCompanySelectAllState();
    }

    applyTransactionFilters() {
        // First filter companies
        const filteredCompanies = this.companies.filter(company => {
            if (!this.transactionFilters.types.includes(company.type)) return false;
            if (this.transactionFilters.industries.length > 0 && 
                !this.transactionFilters.industries.includes(company.industry)) {
                return false;
            }
            if (this.transactionFilters.selectedCompanyIds.length > 0 && 
                !this.transactionFilters.selectedCompanyIds.includes(company.id)) {
                return false;
            }
            return true;
        });

        // Then collect all transactions from filtered companies
        const startDate = new Date(this.transactionFilters.dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(this.transactionFilters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        this.filteredTransactions = [];
        filteredCompanies.forEach(company => {
            company.milestones.forEach(milestone => {
                const milestoneDate = new Date(milestone.date);
                milestoneDate.setHours(0, 0, 0, 0);
                
                // Filter by date range
                if (milestoneDate >= startDate && milestoneDate <= endDate) {
                    // Filter by transaction type
                    if (this.transactionFilters.transactionTypes.length === 0 || 
                        this.transactionFilters.transactionTypes.includes(milestone.type)) {
                        this.filteredTransactions.push({
                            ...milestone,
                            companyId: company.id,
                            companyName: company.name,
                            companyType: company.type,
                            companyIndustry: company.industry
                        });
                    }
                }
            });
        });

        // Sort transactions by date (newest first)
        this.filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        this.updateTransactionStats();
        this.renderTransactionsTable();
        this.updateTransactionSelectAllState();
    }

    updateCompanyStats() {
        const total = this.filteredCompanies.length;
        const publicCount = this.filteredCompanies.filter(c => c.type === 'public').length;
        const privateCount = this.filteredCompanies.filter(c => c.type === 'private').length;

        const totalElement = document.getElementById('company-stat-total');
        const publicElement = document.getElementById('company-stat-public');
        const privateElement = document.getElementById('company-stat-private');
        
        if (totalElement) totalElement.textContent = total;
        if (publicElement) publicElement.textContent = publicCount;
        if (privateElement) privateElement.textContent = privateCount;
    }

    updateTransactionStats() {
        const total = this.filteredTransactions.length;
        const totalElement = document.getElementById('transaction-stat-total');
        if (totalElement) totalElement.textContent = total;
    }

    renderCompaniesTable() {
        const container = document.getElementById('companies-table');
        if (!container) return;

        if (this.filteredCompanies.length === 0) {
            container.innerHTML = '<div class="empty-state">No companies match the selected filters</div>';
            return;
        }

        let html = `
            <table class="companies-table-content">
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>Type</th>
                        <th>Industry</th>
                        <th>Status</th>
                        <th>Revenue</th>
                        <th>Valuation/Market Cap</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.filteredCompanies.forEach(company => {
            const currentStage = this.getCurrentStage(company);
            const valuation = company.type === 'public' ? company.marketCap : company.valuation;

            html += `
                <tr>
                    <td>
                        <div class="company-name" data-company-id="${company.id}">
                            ${company.name}${company.ticker ? ` <span class="ticker">${company.ticker}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="company-type-badge ${company.type}">${company.type}</span>
                    </td>
                    <td>${company.industry}</td>
                    <td>
                        <div class="stage-badge" style="background-color: ${currentStage.color}20; border-left: 3px solid ${currentStage.color};">
                            <div class="stage-label" style="color: ${currentStage.color};">
                                ${currentStage.label}
                            </div>
                        </div>
                    </td>
                    <td>${this.formatCurrency(company.revenue)}</td>
                    <td>${this.formatCurrency(valuation)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;

        // Add click handlers to company names
        container.querySelectorAll('.company-name[data-company-id]').forEach(nameElement => {
            nameElement.addEventListener('click', (e) => {
                e.stopPropagation();
                const companyId = nameElement.dataset.companyId;
                // Search in all companies, not just filtered ones
                const company = this.companies.find(c => String(c.id) === String(companyId));
                if (company) {
                    this.showCompanyModal(company);
                } else {
                    console.error('Company not found:', companyId, 'Available IDs:', this.companies.map(c => c.id));
                }
            });
        });
    }

    renderTransactionsTable() {
        const container = document.getElementById('transactions-table');
        if (!container) return;

        if (this.filteredTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No transactions match the selected filters</div>';
            return;
        }

        let html = `
            <table class="transactions-table-content">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Company</th>
                        <th>Type</th>
                        <th>Transaction Type</th>
                        <th>Amount</th>
                        <th>Valuation</th>
                        <th>Advisors</th>
                        <th>Investors</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.filteredTransactions.forEach(transaction => {
            const transactionInfo = MILESTONE_TYPES[transaction.type];
            const company = this.companies.find(c => c.id === transaction.companyId);
            const advisors = transaction.advisors || 'N/A';
            const investors = transaction.investors || 'N/A';

            html += `
                <tr>
                    <td>${this.formatDate(new Date(transaction.date))}</td>
                    <td>
                        <div class="company-name" data-company-id="${transaction.companyId}">
                            ${transaction.companyName}${company && company.ticker ? ` <span class="ticker">${company.ticker}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="company-type-badge ${transaction.companyType}">${transaction.companyType}</span>
                    </td>
                    <td>
                        <div class="transaction-type-badge" style="background-color: ${transactionInfo.color}20; border-left: 3px solid ${transactionInfo.color};">
                            <span style="color: ${transactionInfo.color};">${transactionInfo.label}</span>
                        </div>
                    </td>
                    <td>${this.formatCurrency(transaction.amount)}</td>
                    <td>${this.formatCurrency(transaction.valuation)}</td>
                    <td>${advisors}</td>
                    <td>${investors}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;

        // Add click handlers to company names
        container.querySelectorAll('.company-name[data-company-id]').forEach(nameElement => {
            nameElement.addEventListener('click', (e) => {
                e.stopPropagation();
                const companyId = nameElement.dataset.companyId;
                // Ensure ID comparison works with string/number conversion
                const company = this.companies.find(c => String(c.id) === String(companyId));
                if (company) {
                    this.showCompanyModal(company);
                } else {
                    console.error('Company not found:', companyId, 'Available IDs:', this.companies.map(c => c.id));
                }
            });
        });
    }

    showCompanyModal(company) {
        const modal = document.getElementById('company-modal');
        const modalName = document.getElementById('modal-company-name');
        const modalBody = document.getElementById('modal-body');
        
        if (!modal || !modalName || !modalBody) return;
        
        modalName.textContent = company.name;
        
        let html = `
            <div class="modal-section">
                <div class="modal-section-title">Company Information</div>
                <div class="modal-info-grid">
                    <div class="modal-info-item">
                        <div class="modal-info-label">Industry</div>
                        <div class="modal-info-value">${company.industry}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Type</div>
                        <div class="modal-info-value">
                            <span class="company-type-badge ${company.type}">${company.type}</span>
                        </div>
                    </div>
                    ${company.ticker ? `
                    <div class="modal-info-item">
                        <div class="modal-info-label">Ticker</div>
                        <div class="modal-info-value">${company.ticker}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="modal-section">
                <div class="modal-section-title">Financial Data</div>
                <div class="modal-financial-grid">
                    <div class="modal-financial-item">
                        <div class="modal-financial-label">Revenue</div>
                        <div class="modal-financial-value">${this.formatCurrency(company.revenue)}</div>
                    </div>
                    <div class="modal-financial-item">
                        <div class="modal-financial-label">Gross Profit</div>
                        <div class="modal-financial-value ${(company.grossProfit || 0) < 0 ? 'negative' : ''}">${this.formatCurrency(company.grossProfit)}</div>
                    </div>
                    <div class="modal-financial-item">
                        <div class="modal-financial-label">Net Profit</div>
                        <div class="modal-financial-value ${(company.netProfit || 0) < 0 ? 'negative' : 'positive'}">${this.formatCurrency(company.netProfit)}</div>
                    </div>
                    <div class="modal-financial-item">
                        <div class="modal-financial-label">${company.type === 'public' ? 'Market Cap' : 'Valuation'}</div>
                        <div class="modal-financial-value">${this.formatCurrency(company.marketCap || company.valuation)}</div>
                    </div>
                </div>
            </div>
        `;

        // Company transactions (milestones) - sorted newest first
        const milestones = (company.milestones || []).slice().sort((a, b) => {
            const da = new Date(a.date);
            const db = new Date(b.date);
            return db - da; // Reverse order: newest first
        });

        if (milestones.length > 0) {
            html += `
            <div class="modal-section">
                <div class="modal-section-title">Transactions</div>
                <div class="modal-transactions-wrapper">
                    <table class="modal-transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Valuation</th>
                                <th>Advisors</th>
                                <th>Investors</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${milestones.map(milestone => {
                                const info = MILESTONE_TYPES[milestone.type] || { label: milestone.type, color: '#6b7280' };
                                const dateStr = milestone.date ? this.formatDate(new Date(milestone.date)) : 'N/A';
                                const amountStr = this.formatCurrency(milestone.amount);
                                const valuationStr = this.formatCurrency(milestone.valuation);
                                const advisorsStr = milestone.advisors || 'N/A';
                                const investorsStr = milestone.investors || 'N/A';
                                return `
                                <tr>
                                    <td>${dateStr}</td>
                                    <td>
                                        <div class="transaction-type-badge" style="background-color: ${info.color}20; border-left: 3px solid ${info.color};">
                                            <span style="color: ${info.color};">${info.label}</span>
                                        </div>
                                    </td>
                                    <td>${amountStr}</td>
                                    <td>${valuationStr}</td>
                                    <td>${advisorsStr}</td>
                                    <td>${investorsStr}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            `;
        }
        
        modalBody.innerHTML = html;
        modal.classList.add('show');
        
        const closeBtn = document.getElementById('modal-close');
        const closeModal = () => {
            modal.classList.remove('show');
        };
        
        if (closeBtn) closeBtn.onclick = closeModal;
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
        
        const escHandler = (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    generateMonthLabels(startDate, endDate) {
        const labels = [];
        const current = new Date(startDate);
        
        while (current <= endDate) {
            labels.push({
                name: current.toLocaleString('default', { month: 'short' }),
                year: current.getFullYear(),
                date: new Date(current)
            });
            current.setMonth(current.getMonth() + 1);
        }
        
        return labels;
    }

    getDatePosition(date, startDate, endDate) {
        const totalMs = endDate.getTime() - startDate.getTime();
        const dateMs = date.getTime() - startDate.getTime();
        return (dateMs / totalMs) * 100;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    getCurrentStage(company) {
        if (company.milestones.length === 0) {
            return { label: 'Pre-Seed', type: 'pre-seed', color: '#d1d5db' };
        }

        // Find the latest STATUS milestone
        let latestStatusMilestone = null;
        for (let i = company.milestones.length - 1; i >= 0; i--) {
            const milestone = company.milestones[i];
            if (STATUS_MILESTONES.includes(milestone.type)) {
                latestStatusMilestone = milestone;
                break;
            }
        }

        if (!latestStatusMilestone) {
            if (company.type === 'public' && company.ticker) {
                return { label: 'IPO Process', type: 'ipo-process', color: '#fca5a5' };
            }
            return { label: 'Pre-Seed', type: 'pre-seed', color: '#d1d5db' };
        }

        const milestoneInfo = MILESTONE_TYPES[latestStatusMilestone.type];
        
        return {
            label: milestoneInfo.label,
            type: latestStatusMilestone.type,
            color: milestoneInfo.color,
            date: latestStatusMilestone.date
        };
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for data to load (if using JSON)
    const initDashboard = () => {
        try {
            // Check if data loaded
            if (typeof COMPANIES_DATA === 'undefined' || COMPANIES_DATA.length === 0) {
                // Wait a bit more for async loading
                setTimeout(initDashboard, 100);
                return;
            }
            
            if (typeof MILESTONE_TYPES === 'undefined' || Object.keys(MILESTONE_TYPES).length === 0) {
                setTimeout(initDashboard, 100);
                return;
            }
            
            console.log('Initializing Finance Dashboard...');
            console.log('Companies data loaded:', COMPANIES_DATA.length, 'companies');
            console.log('Milestone types:', Object.keys(MILESTONE_TYPES).length, 'types');
            
            const dashboard = new FinanceDashboard();
            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'padding: 20px; color: red; background: #fee; border: 2px solid red; margin: 20px;';
            errorDiv.innerHTML = `
                <h1>Error Loading Dashboard</h1>
                <p><strong>Error:</strong> ${error.message}</p>
                <pre style="background: #fff; padding: 10px; overflow: auto;">${error.stack || 'No stack trace'}</pre>
                <p>Please check the browser console (F12) for more details.</p>
                <p>Make sure data.json exists or data.js is loaded.</p>
            `;
            document.body.insertBefore(errorDiv, document.body.firstChild);
        }
    };
    
    initDashboard();
});
