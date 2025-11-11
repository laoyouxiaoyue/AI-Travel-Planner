// AI旅行规划器前端应用
class TravelPlannerApp {
    constructor() {
        // 自动适配当前访问端口，避免写死端口
        this.apiBase = `${window.location.origin.replace(/\/$/, '')}/api/v1`;
        this.token = localStorage.getItem('token');
        this.currentUser = null;
        this.currentEditingExpenseId = null;
        this.expenseCache = [];
        this.map = null;
        this.mapMarkers = [];
        this.mapRoute = null;
        this.mapMode = 'driving';
        this.amapLoaded = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.setupDateInputs();
    }

    setupEventListeners() {
        // 导航菜单
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(link.getAttribute('href').substring(1));
            });
        });

        // 认证按钮
        document.getElementById('loginBtn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('registerBtn').addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // 模态框关闭
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                const modalContent = modal.querySelector('.modal-content');
                // 移除large类，以便其他模态框可以正常显示
                if (modalContent) {
                    modalContent.classList.remove('large');
                }
                modal.style.display = 'none';
            });
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                const modalContent = e.target.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.classList.remove('large');
                }
                e.target.style.display = 'none';
            }
        });

        // 认证标签页
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchAuthTab(tab);
            });
        });

        // 认证表单
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // 创建行程
        document.getElementById('createPlanBtn').addEventListener('click', () => this.createTravelPlan());

        // 语音输入
        document.getElementById('voiceBtn').addEventListener('click', () => this.toggleVoiceInput());

        // 新建行程按钮
        document.getElementById('newPlanBtn').addEventListener('click', () => this.showPage('home'));
        // 添加费用按钮
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.showAddExpenseModal());
        // 语音记账
        const expenseVoiceBtn = document.getElementById('expenseVoiceBtn');
        if (expenseVoiceBtn) expenseVoiceBtn.addEventListener('click', () => this.startExpenseVoice());

        // 设置页面相关
        document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchProfileTab(tab);
            });
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('testApiKeyBtn').addEventListener('click', () => this.testApiKey());
        document.getElementById('saveAmapSettingsBtn').addEventListener('click', () => this.saveAmapSettings());
        document.getElementById('testAmapApiKeyBtn').addEventListener('click', () => this.testAmapApiKey());

        // 为表单字段添加输入事件监听器，清除错误状态
        this.setupFormValidation();
        
        // 加载设置
        this.loadSettings();

        // 地图相关事件监听
        this.setupMapEventListeners();
    }

    setupMapEventListeners() {
        // 地图搜索
        const mapSearchBtn = document.getElementById('mapSearchBtn');
        if (mapSearchBtn) {
            mapSearchBtn.addEventListener('click', () => this.searchPOI());
        }

        // 地图路线规划
        const mapRouteBtn = document.getElementById('mapRouteBtn');
        if (mapRouteBtn) {
            mapRouteBtn.addEventListener('click', () => this.planRoute());
        }

        // 清除地图
        const mapClearBtn = document.getElementById('mapClearBtn');
        if (mapClearBtn) {
            mapClearBtn.addEventListener('click', () => this.clearMap());
        }

        // 导航方式切换
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.mapMode = e.target.dataset.mode;
            });
        });

        // 起点搜索
        const mapOriginGeocode = document.getElementById('mapOriginGeocode');
        if (mapOriginGeocode) {
            mapOriginGeocode.addEventListener('click', () => this.geocodeAddress('origin'));
        }

        // 终点搜索
        const mapDestinationGeocode = document.getElementById('mapDestinationGeocode');
        if (mapDestinationGeocode) {
            mapDestinationGeocode.addEventListener('click', () => this.geocodeAddress('destination'));
        }
    }

    setupFormValidation() {
        const formFields = ['destination', 'startDate', 'endDate', 'budget', 'people'];
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => {
                    field.classList.remove('error');
                });
                field.addEventListener('change', () => {
                    field.classList.remove('error');
                });
            }
        });
    }

    setupDateInputs() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        document.getElementById('startDate').value = tomorrow.toISOString().split('T')[0];
        document.getElementById('endDate').value = nextWeek.toISOString().split('T')[0];
    }

    checkAuthStatus() {
        if (this.token) {
            this.loadUserProfile();
        } else {
            this.showAuthButtons();
        }
    }

    async loadUserProfile() {
        try {
            const response = await this.apiCall('/profile', 'GET');
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showUserMenu();
                this.loadTravelPlans();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
            this.logout();
        }
    }

    showAuthButtons() {
        document.getElementById('loginBtn').style.display = 'inline-block';
        document.getElementById('registerBtn').style.display = 'inline-block';
        document.getElementById('userMenu').style.display = 'none';
    }

    showUserMenu() {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('userMenu').style.display = 'flex';
        document.getElementById('userName').textContent = this.currentUser.username;
    }

    showPage(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        document.getElementById(pageId).classList.add('active');

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${pageId}"]`).classList.add('active');

        // 加载页面数据
        if (pageId === 'plans') {
            this.loadTravelPlans();
        } else if (pageId === 'expenses') {
            this.loadExpenses();
        } else if (pageId === 'profile') {
            this.loadSettings();
        } else if (pageId === 'map') {
            // 延迟初始化地图，确保页面已显示且容器可见
            setTimeout(() => {
                this.initMap();
            }, 200);
        }
    }

    showAuthModal(type) {
        document.getElementById('authModal').style.display = 'block';
        this.switchAuthTab(type);
    }

    switchAuthTab(tab) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // 显示对应表单
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('token', this.token);
                this.showUserMenu();
                document.getElementById('authModal').style.display = 'none';
                this.showMessage('登录成功！', 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.error || '登录失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    async handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('token', this.token);
                this.showUserMenu();
                document.getElementById('authModal').style.display = 'none';
                this.showMessage('注册成功！', 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.error || '注册失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        this.showAuthButtons();
        this.showPage('home');
        this.showMessage('已退出登录', 'success');
    }

    async createTravelPlan() {
        if (!this.token) {
            this.showAuthModal('login');
            return;
        }

        const destination = document.getElementById('destination').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const budgetInput = document.getElementById('budget').value.trim();
        const peopleInput = document.getElementById('people').value.trim();
        const preferences = document.getElementById('preferences').value.trim();

        // 清除之前的错误状态
        this.clearFieldErrors();

        // 验证必填字段
        const missingFields = [];
        const errorFields = [];
        
        if (!destination) {
            missingFields.push('目的地');
            errorFields.push('destination');
        }
        if (!startDate) {
            missingFields.push('出发日期');
            errorFields.push('startDate');
        }
        if (!endDate) {
            missingFields.push('返回日期');
            errorFields.push('endDate');
        }
        if (!budgetInput || isNaN(parseFloat(budgetInput)) || parseFloat(budgetInput) <= 0) {
            missingFields.push('预算');
            errorFields.push('budget');
        }
        if (!peopleInput || isNaN(parseInt(peopleInput)) || parseInt(peopleInput) < 1) {
            missingFields.push('人数');
            errorFields.push('people');
        }

        if (missingFields.length > 0) {
            this.highlightErrorFields(errorFields);
            this.showMessage(`请填写以下必填字段：${missingFields.join('、')}`, 'error');
            return;
        }

        // 转换数据类型并进一步验证
        const budget = parseFloat(budgetInput);
        const people = parseInt(peopleInput);

        // 验证日期逻辑
        if (new Date(startDate) >= new Date(endDate)) {
            this.showMessage('返回日期必须晚于出发日期', 'error');
            return;
        }

        // 获取用户配置的API Key
        const userApiKey = this.getUserApiKey();
        const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        const userBaseUrl = userSettings.openaiBaseUrl || 'https://api.openai.com/v1';
        const userModel = userSettings.openaiModel || '';

        const planData = {
            title: `${destination}旅行`,
            destination,
            start_date: startDate,
            end_date: endDate,
            budget,
            people,
            preferences: preferences ? { description: preferences } : {},
            // 传递用户配置的API Key（如果存在）
            openai_api_key: userApiKey || undefined,
            openai_base_url: userBaseUrl,
            openai_model: userModel
        };

        try {
            this.showLoading(document.getElementById('createPlanBtn'));
            const response = await this.apiCall('/travel/plan', 'POST', planData);
            
            if (response.ok) {
                const data = await response.json();
                this.showMessage('行程创建成功！', 'success');
                this.showPage('plans');
                this.loadTravelPlans();
            } else {
                const error = await response.json();
                this.showMessage(error.error || '创建行程失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请重试', 'error');
        } finally {
            this.hideLoading(document.getElementById('createPlanBtn'));
        }
    }

    async loadTravelPlans() {
        if (!this.token) return;

        try {
            const response = await this.apiCall('/travel/plans', 'GET');
            if (response.ok) {
                const data = await response.json();
                this.displayTravelPlans(data.plans || []);
            }
        } catch (error) {
            console.error('加载行程失败:', error);
        }
    }

    displayTravelPlans(plans) {
        const container = document.getElementById('plansList');
        if (plans.length === 0) {
            container.innerHTML = '<p>暂无行程，点击"新建行程"开始规划您的旅行！</p>';
            return;
        }

        container.innerHTML = plans.map(plan => `
            <div class="plan-card">
                <h3>${plan.title}</h3>
                <p><strong>目的地:</strong> ${plan.destination}</p>
                <p><strong>出发日期:</strong> ${plan.start_date}</p>
                <p><strong>返回日期:</strong> ${plan.end_date}</p>
                <p><strong>预算:</strong> ¥${plan.budget}</p>
                <p><strong>人数:</strong> ${plan.people}人</p>
                <p><strong>状态:</strong> ${plan.status}</p>
                <div class="plan-actions">
                    <button class="btn btn-primary" onclick="app.viewPlan('${plan.id}')">查看详情</button>
                    <button class="btn btn-outline" onclick="app.editPlan('${plan.id}')">编辑</button>
                    <button class="btn btn-outline" onclick="app.deletePlan('${plan.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    async loadExpenses() {
        if (!this.token) return;
        try {
            // 加载行程选择
            const plansRes = await this.apiCall('/travel/plans', 'GET');
            const { plans = [] } = plansRes.ok ? await plansRes.json() : { plans: [] };
            const select = document.getElementById('expensePlanSelect');
            if (select) {
                select.innerHTML = plans.map(p => `<option value="${p.id}">${p.title || p.destination}（${p.start_date}~${p.end_date}）</option>`).join('');
                select.onchange = () => this.loadExpenses();
            }
            const planId = (select && select.value) || (plans[0]?.id || '');
            if (!planId) {
                this.displayExpenses([], { budget: 0 });
                return;
            }
            // 获取选中行程详情以显示预算
            const planRes = await this.apiCall(`/travel/plans/${planId}`, 'GET');
            let budget = 0;
            if (planRes.ok) {
                const planData = await planRes.json();
                budget = planData?.plan?.budget || 0;
            }
            // 获取费用列表
            const res = await this.apiCall(`/travel/expenses?plan_id=${encodeURIComponent(planId)}`, 'GET');
            if (!res.ok) {
                this.displayExpenses([], { budget });
                return;
            }
            const data = await res.json();
            this.expenseCache = data.expenses || [];
            this.displayExpenses(this.expenseCache, { budget });
        } catch (error) {
            console.error('加载费用失败:', error);
        }
    }

    displayExpenses(expenses, meta = { budget: 0 }) {
        const container = document.getElementById('expensesList');
        const total = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
        const budget = meta.budget || 0;
        const remaining = Math.max(0, budget - total);
        document.getElementById('totalExpense').textContent = `¥${total.toFixed(2)}`;
        document.getElementById('budgetAmount').textContent = `¥${budget.toFixed(2)}`;
        document.getElementById('remainingAmount').textContent = `¥${remaining.toFixed(2)}`;

        if (!expenses || expenses.length === 0) {
            container.innerHTML = '<p>暂无费用记录，点击“添加费用”开始记录您的支出！</p>';
            return;
        }
        container.innerHTML = expenses.map(e => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-title">${e.description || e.category || '费用'}</div>
                    <div class="expense-meta">${e.category || '-'} · ${e.date ? new Date(e.date).toLocaleDateString() : ''} · ${e.currency || 'CNY'}</div>
                </div>
                <div class="expense-amount">
                    ¥${Number(e.amount || 0).toFixed(2)}
                    <button class="btn btn-outline btn-small" data-action="edit-expense" data-id="${e.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-outline btn-small danger" data-action="delete-expense" data-id="${e.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        container.querySelectorAll('[data-action="edit-expense"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const expense = this.expenseCache.find(item => item.id === btn.dataset.id);
                if (expense) {
                    this.showAddExpenseModal(expense);
                }
            });
        });
        container.querySelectorAll('[data-action="delete-expense"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const expense = this.expenseCache.find(item => item.id === btn.dataset.id);
                if (expense) {
                    this.deleteExpense(expense);
                }
            });
        });
    }

    toggleVoiceInput() {
        const voiceBtn = document.getElementById('voiceBtn');
        const status = document.getElementById('voiceStatus');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showMessage('您的浏览器不支持语音识别功能', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i> 停止录音';
            status.textContent = '正在听取您的语音...';
            voiceBtn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const container = document.getElementById('voiceResult');
            container.innerHTML = `
                <h4>识别结果:</h4>
                <p>${transcript.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                <button id="processVoiceBtn" class="btn btn-primary">处理语音输入</button>
            `;
            // 绑定点击事件，避免内联onclick在包含引号/特殊字符时失效
            const processBtn = document.getElementById('processVoiceBtn');
            if (processBtn) {
                processBtn.addEventListener('click', () => this.processVoiceInput(transcript));
            }
        };

        recognition.onerror = (event) => {
            this.showMessage('语音识别错误: ' + event.error, 'error');
        };

        recognition.onend = () => {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> 点击说话';
            status.textContent = '';
            voiceBtn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
        };

        if (voiceBtn.textContent.includes('停止')) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    async processVoiceInput(transcript) {
        const text = String(transcript || '').trim();
        const lower = text.toLowerCase();

        // 1) 优先调用后端大模型解析
        let result = null;
        try {
            const res = await this.apiCall('/voice/understand', 'POST', {
                transcript: text,
                openai_api_key: this.getUserApiKey() || undefined,
                openai_base_url: (JSON.parse(localStorage.getItem('userSettings')||'{}').openaiBaseUrl) || undefined,
                openai_model: (JSON.parse(localStorage.getItem('userSettings')||'{}').openaiModel) || undefined,
            });
            if (res.ok) {
                const data = await res.json();
                result = data.fields || null;
            }
        } catch (e) { /* 忽略，回退本地规则 */ }

        // 2) 回退到本地规则解析
        if (!result) {
            result = this.parseSpeechToFormData(text, lower);
        }

        // 写回表单（仅覆盖识别出的字段）
        if (result.destination) document.getElementById('destination').value = result.destination;
        if (result.startDate) document.getElementById('startDate').value = result.startDate;
        if (result.endDate) document.getElementById('endDate').value = result.endDate;
        if (typeof result.budget === 'number' && !Number.isNaN(result.budget)) document.getElementById('budget').value = String(result.budget);
        if (typeof result.people === 'number' && !Number.isNaN(result.people) && result.people > 0) document.getElementById('people').value = String(result.people);
        if (result.preferences && result.preferences.length > 0) {
            document.getElementById('preferences').value = result.preferences.join('、');
        }

        const summary = [
            result.destination ? `目的地：${result.destination}` : null,
            result.startDate && result.endDate ? `日期：${result.startDate} ~ ${result.endDate}` : null,
            typeof result.budget === 'number' ? `预算：¥${Math.round(result.budget)}` : null,
            typeof result.people === 'number' ? `人数：${result.people}人` : null,
            result.preferences?.length ? `偏好：${result.preferences.join('、')}` : null,
        ].filter(Boolean).join(' | ');

        this.showMessage(summary || '语音输入已处理，请检查表单内容', 'success');
    }

    // 将语音文本解析为表单字段
    parseSpeechToFormData(text, lower) {
        const now = new Date();
        const todayStr = this.formatDate(now);

        // 目的地提取：基于动词触发与地名后缀启发式
        let destination = '';
        const destTriggers = /(去|到|想去|打算去|目的地|去往|前往)([\u4e00-\u9fa5A-Za-z\s·\-]{1,20})/;
        const m1 = text.match(destTriggers);
        if (m1 && m1[2]) destination = m1[2].replace(/(玩|旅游|旅行|出差|看看|一下)$/,'').trim();
        // 后缀启发：xxx市/县/省/国/洲/州/岛/城
        if (!destination) {
            const m2 = text.match(/([\u4e00-\u9fa5A-Za-z·\-]{1,12})(市|县|省|国|洲|州|岛|城)/);
            if (m2) destination = (m2[1] + m2[2]).trim();
        }

        // 日期解析
        const explicit = this.extractDateRange(text);
        let startDate = explicit.start || '';
        let endDate = explicit.end || '';
        if (!startDate || !endDate) {
            // 相对日期 + 时长
            const rel = this.extractRelativeDates(text, now);
            startDate = startDate || rel.start || '';
            endDate = endDate || rel.end || '';
        }

        // 人数解析（含中文数字）
        let people = this.extractPeople(text);

        // 预算解析（支持“万/千/左右/大约”等）
        let budget = this.extractBudget(text);

        // 偏好关键词
        const preferences = this.extractPreferences(text);

        // 兜底：如有时长但缺结束日期，按3天补全
        if (startDate && !endDate) {
            const days = explicit.days || 0;
            const duration = days > 0 ? days : 3;
            endDate = this.formatDate(this.addDays(new Date(startDate), duration));
        }

        return { destination, startDate, endDate, people, budget, preferences };
    }

    // 金额解析：支持 “预算一万二/一千/5000块/大概8000左右”
    extractBudget(text) {
        if (!/(预算|花费|费用|经费|多少钱|钱)/.test(text)) return undefined;
        // 提取数值 + 单位
        const unitMatch = text.match(/([零一二三四五六七八九十百千万0-9\.]+)(万|千)?\s*(多|左右|上下)?\s*(元|块|人民币)?/);
        if (!unitMatch) return undefined;
        const num = this.parseChineseNumber(unitMatch[1]);
        if (isNaN(num)) return undefined;
        let amount = num;
        const unit = unitMatch[2];
        if (unit === '万') amount *= 10000;
        if (unit === '千') amount *= 1000;
        return Math.round(amount);
    }

    // 人数解析：支持 “两人/我们三个人/5人/俩人/一家四口”
    extractPeople(text) {
        // 一家N口
        const family = text.match(/一家([零一二三四五六七八九十两几0-9]+)口/);
        if (family) return this.parseChineseNumber(family[1]);
        const m = text.match(/([零一二三四五六七八九十两几0-9]+)\s*人/);
        if (m) {
            let n = this.parseChineseNumber(m[1]);
            if (m[1] === '几') n = 3; // 约数
            return n > 0 ? n : undefined;
        }
        return undefined;
    }

    // 显式日期范围：YYYY-MM-DD / YYYY年M月D日 / X月X日 到 X月X日 / 从X到Y
    extractDateRange(text) {
        // 标准日期
        const isoRange = text.match(/(\d{4}[\-/年]\d{1,2}[\-/月]\d{1,2}日?)[^\d]{0,3}(到|至|~|-|—|—|––|—\s*)(\d{4}[\-/年]\d{1,2}[\-/月]\d{1,2}日?)/);
        if (isoRange) {
            return {
                start: this.normalizeDate(isoRange[1]),
                end: this.normalizeDate(isoRange[3]),
                days: this.diffDays(this.normalizeDate(isoRange[1]), this.normalizeDate(isoRange[3]))
            };
        }
        // 同年省略年的范围： M月D日 到 M月D日
        const mdRange = text.match(/(\d{1,2})月(\d{1,2})日?\s*(到|至|到\s*|~|-)\s*(\d{1,2})月(\d{1,2})日?/);
        if (mdRange) {
            const y = new Date().getFullYear();
            const s = this.formatYMD(y, mdRange[1], mdRange[2]);
            const e = this.formatYMD(y, mdRange[4], mdRange[5]);
            return { start: s, end: e, days: this.diffDays(s, e) };
        }
        // 单个日期
        const singleISO = text.match(/(\d{4}[\-/年]\d{1,2}[\-/月]\d{1,2}日?)/);
        if (singleISO) {
            return { start: this.normalizeDate(singleISO[1]) };
        }
        const singleMD = text.match(/(\d{1,2})月(\d{1,2})日?/);
        if (singleMD) {
            const y = new Date().getFullYear();
            return { start: this.formatYMD(y, singleMD[1], singleMD[2]) };
        }
        // 时长：N天/三天/5日
        const dur = text.match(/([零一二三四五六七八九十两0-9]+)\s*(天|日)/);
        const days = dur ? this.parseChineseNumber(dur[1]) : 0;
        return { start: '', end: '', days };
    }

    extractRelativeDates(text, now) {
        const add = (d) => this.formatDate(this.addDays(now, d));
        // 明天/后天/大后天
        if (/大后天/.test(text)) return { start: add(3), end: '' };
        if (/后天/.test(text)) return { start: add(2), end: '' };
        if (/明天|明日|翌日/.test(text)) return { start: add(1), end: '' };

        // 本周末/周末：取周六到周日
        if (/本周末|这周末|周末/.test(text)) {
            const day = now.getDay();
            const toSat = (6 - day + 7) % 7; // 到周六
            const start = this.addDays(now, toSat);
            const end = this.addDays(start, 1);
            return { start: this.formatDate(start), end: this.formatDate(end) };
        }

        // 下周X（周一~周日）
        const weekMap = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':0,'天':0 };
        const nw = text.match(/下周([一二三四五六日天])/);
        if (nw) {
            const target = weekMap[nw[1]];
            const day = now.getDay();
            const delta = ((7 - day) % 7) + target; // 到下周目标日
            const start = this.addDays(now, delta);
            return { start: this.formatDate(start), end: '' };
        }
        return { start: '', end: '' };
    }

    parseChineseNumber(token) {
        if (!token) return NaN;
        // 直接数字
        if (/^[0-9\.]+$/.test(token)) return parseFloat(token);
        const map = { '零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'百':100,'千':1000,'万':10000 };
        let total = 0, unit = 1, num = 0;
        for (let i = token.length - 1; i >= 0; i--) {
            const ch = token[i];
            const val = map[ch];
            if (val == null) continue;
            if (val >= 10) {
                if (val > unit) unit = val; else unit *= val;
            } else {
                num += val * unit;
            }
        }
        total += num;
        if (total === 0 && (token === '十')) total = 10;
        return total || NaN;
    }

    diffDays(s, e) {
        try { return Math.max(0, Math.round((new Date(e) - new Date(s)) / 86400000)); } catch { return 0; }
    }
    addDays(date, n) {
        const d = new Date(date);
        d.setDate(d.getDate() + n);
        return d;
    }
    formatDate(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        return `${y}-${m}-${dd}`;
    }
    formatYMD(y, m, d) {
        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }
    normalizeDate(s) {
        // 支持 2025/1/5、2025-1-5、2025年1月5日
        const m = s.match(/(\d{4})[\-/年](\d{1,2})[\-/月](\d{1,2})/);
        if (m) return this.formatYMD(m[1], m[2], m[3]);
        return s;
    }

    extractPreferences(text) {
        const dict = ['美食','亲子','徒步','登山','露营','自驾','购物','博物馆','艺术','海滩','潜水','滑雪','文化','夜生活','摄影','小众','轻松','网红','历史','古镇','温泉'];
        const found = [];
        dict.forEach(k => { if (text.includes(k)) found.push(k); });
        // 关键词短语
        if (/慢节奏|休闲|放松/.test(text)) found.push('轻松');
        if (/人少|小众/.test(text)) found.push('小众');
        return Array.from(new Set(found));
    }

    showAddExpenseModal(expense = null) {
        const planSelect = document.getElementById('expensePlanSelect');
        const planId = planSelect ? planSelect.value : '';
        if (!planId) {
            this.showMessage('请先创建并选择一个行程', 'error');
            return;
        }
        this.currentEditingExpenseId = expense ? expense.id : null;
        const body = document.getElementById('modalBody');
        body.innerHTML = `
            <div class="input-group">
                <label>类别</label>
                <select id="expenseCategory">
                    <option value="food">餐饮</option>
                    <option value="transport">交通</option>
                    <option value="accommodation">住宿</option>
                    <option value="shopping">购物</option>
                    <option value="other">其他</option>
                </select>
            </div>
            <div class="input-group">
                <label>描述</label>
                <input type="text" id="expenseDescription" placeholder="如：午餐、打车、酒店">
            </div>
            <div class="input-group">
                <label>金额（元）</label>
                <input type="number" id="expenseAmount" step="0.01" min="0">
            </div>
            <div class="input-group">
                <label>日期</label>
                <input type="date" id="expenseDate" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="input-group">
                <label>币种</label>
                <input type="text" id="expenseCurrency" value="CNY">
            </div>
            <div class="settings-actions" style="justify-content:flex-end;">
                <button id="expenseVoiceFill" class="btn btn-outline"><i class="fas fa-microphone"></i> 语音填表</button>
                <button id="saveExpenseBtn" class="btn btn-primary"><i class="fas fa-save"></i> ${expense ? '更新' : '保存'}</button>
            </div>
        `;
        document.getElementById('modal').style.display = 'block';
        if (expense) {
            const dateStr = expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            document.getElementById('expenseCategory').value = expense.category || 'other';
            document.getElementById('expenseDescription').value = expense.description || '';
            document.getElementById('expenseAmount').value = typeof expense.amount === 'number' ? expense.amount : '';
            document.getElementById('expenseDate').value = dateStr;
            document.getElementById('expenseCurrency').value = expense.currency || 'CNY';
        }
        const saveBtn = document.getElementById('saveExpenseBtn');
        saveBtn.onclick = async () => {
            const category = document.getElementById('expenseCategory').value;
            const description = document.getElementById('expenseDescription').value.trim();
            const amountStr = document.getElementById('expenseAmount').value.trim();
            const date = document.getElementById('expenseDate').value;
            const currency = (document.getElementById('expenseCurrency').value || 'CNY').trim();
            const amount = parseFloat(amountStr);
            if (!description || !(amount > 0) || !date) {
                this.showMessage('请填写描述、金额和日期', 'error');
                return;
            }
            const payload = { plan_id: planId, category, description, amount, currency, date };
            let res;
            try {
                if (this.currentEditingExpenseId) {
                    res = await this.apiCall(`/travel/expenses/${this.currentEditingExpenseId}`, 'PUT', payload);
                } else {
                    res = await this.apiCall('/travel/expenses', 'POST', payload);
                }
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    this.showMessage(err.error || '保存失败', 'error');
                    return;
                }
                this.showMessage(this.currentEditingExpenseId ? '更新成功' : '保存成功', 'success');
                document.getElementById('modal').style.display = 'none';
                this.currentEditingExpenseId = null;
                this.loadExpenses();
            } catch (e) {
                this.showMessage('网络错误，请重试', 'error');
            }
        };
        document.getElementById('expenseVoiceFill').onclick = () => this.startExpenseVoice(true);
    }

    async deleteExpense(expense) {
        if (!expense || !expense.id) return;
        if (!confirm('确定删除该费用记录吗？')) return;
        try {
            const res = await this.apiCall(`/travel/expenses/${expense.id}`, 'DELETE');
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                this.showMessage(err.error || '删除失败', 'error');
                return;
            }
            this.showMessage('已删除', 'success');
            this.loadExpenses();
        } catch (e) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    // 语音记账：启动识别，并调用后端AI解析为费用字段
    startExpenseVoice(fillModal = false) {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showMessage('您的浏览器不支持语音识别功能', 'error');
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            try {
                const res = await this.apiCall('/voice/understand-expense', 'POST', {
                    transcript,
                    openai_api_key: this.getUserApiKey() || undefined,
                    openai_base_url: (JSON.parse(localStorage.getItem('userSettings')||'{}').openaiBaseUrl) || undefined,
                    openai_model: (JSON.parse(localStorage.getItem('userSettings')||'{}').openaiModel) || undefined,
                });
                let fields = {};
                if (res.ok) {
                    const data = await res.json();
                    fields = data.fields || {};
                }
                this.fillExpenseFieldsFromAI(fields, fillModal);
                this.showMessage('语音解析完成', 'success');
            } catch (e) {
                this.showMessage('语音解析失败', 'error');
            }
        };
        recognition.onerror = () => this.showMessage('语音识别错误', 'error');
        recognition.start();
    }

    fillExpenseFieldsFromAI(fields, fillModal) {
        // fields: { category, description, amount, currency, date }
        const setVal = (id, v) => { const el = document.getElementById(id); if (el && v != null && v !== '') el.value = v; };
        if (fillModal) {
            setVal('expenseCategory', fields.category);
            setVal('expenseDescription', fields.description);
            if (typeof fields.amount === 'number' && !Number.isNaN(fields.amount)) setVal('expenseAmount', String(fields.amount));
            setVal('expenseCurrency', fields.currency || 'CNY');
            setVal('expenseDate', fields.date);
        } else {
            // 未来可扩展：直接生成一条费用
        }
    }

    viewPlan(planId) {
        if (!this.token) {
            this.showAuthModal('login');
            return;
        }
        this.fetchAndShowPlanDetail(planId);
    }

    editPlan(planId) {
        this.showMessage('编辑行程功能开发中...', 'success');
    }

    deletePlan(planId) {
        if (confirm('确定要删除这个行程吗？')) {
            this.showMessage('删除行程功能开发中...', 'success');
        }
    }

    async fetchAndShowPlanDetail(planId) {
        try {
            const res = await this.apiCall(`/travel/plans/${planId}`, 'GET');
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                this.showMessage(err.error || '获取行程详情失败', 'error');
                return;
            }
            const data = await res.json();
            this.renderPlanDetailModal(data);
        } catch (e) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    renderPlanDetailModal(data) {
        const plan = data.plan || {};
        const days = data.days || [];
        const actsByDay = data.activities_by_day || {};
        const expenseSummary = data.expense_summary || {};

        // 计算行程天数
        const totalDays = days.length;
        const startDate = plan.start_date ? new Date(plan.start_date) : null;
        const endDate = plan.end_date ? new Date(plan.end_date) : null;
        
        // 计算总费用
        const totalExpense = expenseSummary.total || 0;
        const budget = plan.budget || 0;
        const remaining = Math.max(0, budget - totalExpense);
        const expensePercentage = budget > 0 ? (totalExpense / budget * 100).toFixed(1) : 0;

        // 获取活动图标
        const getActivityIcon = (type) => {
            const iconMap = {
                '餐饮': 'fa-utensils',
                '住宿': 'fa-hotel',
                '交通': 'fa-car',
                '景点': 'fa-landmark',
                '购物': 'fa-shopping-bag',
                '娱乐': 'fa-theater-masks',
                '其他': 'fa-map-marker-alt'
            };
            for (const key in iconMap) {
                if (type && type.includes(key)) {
                    return iconMap[key];
                }
            }
            return 'fa-map-marker-alt';
        };

        // 格式化日期
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'short'
            });
        };

        // HTML转义函数
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        // 生成每日行程
        const dayBlocks = days.map((d, idx) => {
            const acts = actsByDay[d.id] || [];
            const date = d.date ? new Date(d.date) : (startDate ? new Date(startDate.getTime() + idx * 24 * 60 * 60 * 1000) : null);
            
            const actsHtml = acts.length
                ? acts.map((a, actIdx) => {
                    const icon = getActivityIcon(a.type);
                    const title = escapeHtml(a.title || a.type || '活动');
                    const location = a.location ? escapeHtml(a.location) : '';
                    const description = a.description ? escapeHtml(a.description) : '';
                    const cost = a.cost ? parseFloat(a.cost).toFixed(2) : '';
                    
                    return `
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-header">
                                    <h5 class="activity-title">${title}</h5>
                                    ${cost ? `<span class="activity-cost">¥${cost}</span>` : ''}
                                </div>
                                ${location ? `<div class="activity-location"><i class="fas fa-map-marker-alt"></i> ${location}</div>` : ''}
                                ${description ? `<div class="activity-description">${description}</div>` : ''}
                                ${location ? `<button class="btn btn-small btn-outline view-on-map-btn" data-location="${location.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}">
                                    <i class="fas fa-map"></i> 查看地图
                                </button>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')
                : '<div class="activity-item empty"><div class="activity-content"><p class="muted">暂无活动安排</p></div></div>';

            return `
                <div class="plan-day-card">
                    <div class="day-header">
                        <div class="day-number">
                            <span class="day-badge">Day ${d.day_number || (idx + 1)}</span>
                        </div>
                        <div class="day-info">
                            <h4 class="day-title">第 ${d.day_number || (idx + 1)} 天</h4>
                            ${date ? `<p class="day-date"><i class="fas fa-calendar"></i> ${formatDate(date.toISOString().split('T')[0])}</p>` : ''}
                        </div>
                        <div class="day-stats">
                            ${acts.length > 0 ? `<span class="activity-count"><i class="fas fa-list"></i> ${acts.length} 个活动</span>` : ''}
                            ${acts.reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0) > 0 
                                ? `<span class="day-cost">¥${acts.reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0).toFixed(2)}</span>` 
                                : ''}
                        </div>
                    </div>
                    <div class="day-activities">
                        ${actsHtml}
                    </div>
                </div>
            `;
        }).join('');

        // 生成HTML
        const html = `
            <div class="plan-detail-container">
                <!-- 行程头部信息 -->
                <div class="plan-header">
                    <div class="plan-header-main">
                        <h2 class="plan-title">
                            <i class="fas fa-map-marked-alt"></i>
                            ${escapeHtml(plan.title || '行程详情')}
                        </h2>
                        <div class="plan-meta">
                            <div class="meta-item">
                                <i class="fas fa-location-dot"></i>
                                <span>${escapeHtml(plan.destination || '-')}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-calendar-days"></i>
                                <span>${totalDays} 天</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-users"></i>
                                <span>${escapeHtml(String(plan.people || '-'))} 人</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-wallet"></i>
                                <span>预算 ¥${budget.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="plan-dates">
                        <div class="date-item">
                            <div class="date-label">出发日期</div>
                            <div class="date-value">${startDate ? escapeHtml(formatDate(plan.start_date)) : '-'}</div>
                        </div>
                        <div class="date-separator">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div class="date-item">
                            <div class="date-label">返回日期</div>
                            <div class="date-value">${endDate ? escapeHtml(formatDate(plan.end_date)) : '-'}</div>
                        </div>
                    </div>
                </div>

                <!-- 费用统计 -->
                ${budget > 0 ? `
                <div class="plan-expense-summary">
                    <h3><i class="fas fa-chart-pie"></i> 费用统计</h3>
                    <div class="expense-stats">
                        <div class="expense-stat-item">
                            <div class="expense-label">总支出</div>
                            <div class="expense-value expense-total">¥${totalExpense.toFixed(2)}</div>
                        </div>
                        <div class="expense-stat-item">
                            <div class="expense-label">预算</div>
                            <div class="expense-value expense-budget">¥${budget.toFixed(2)}</div>
                        </div>
                        <div class="expense-stat-item">
                            <div class="expense-label">剩余</div>
                            <div class="expense-value ${remaining > 0 ? 'expense-remaining' : 'expense-over'}">
                                ${remaining > 0 ? '¥' + remaining.toFixed(2) : '已超支 ¥' + Math.abs(remaining).toFixed(2)}
                            </div>
                        </div>
                        <div class="expense-stat-item">
                            <div class="expense-label">使用率</div>
                            <div class="expense-value expense-percentage">${expensePercentage}%</div>
                        </div>
                    </div>
                    <div class="expense-progress">
                        <div class="expense-progress-bar" style="width: ${Math.min(expensePercentage, 100)}%"></div>
                    </div>
                </div>
                ` : ''}

                <!-- 每日行程 -->
                <div class="plan-days-container">
                    <h3 class="section-title">
                        <i class="fas fa-route"></i>
                        行程安排
                    </h3>
                    ${dayBlocks || '<p class="muted">暂无行程日程</p>'}
                </div>

                <!-- 操作按钮 -->
                <div class="plan-actions-footer">
                    <button class="btn btn-primary view-plan-on-map-btn" data-plan-id="${plan.id || ''}">
                        <i class="fas fa-map"></i> 在地图上查看
                    </button>
                    <button class="btn btn-outline export-plan-btn" data-plan-id="${plan.id || ''}">
                        <i class="fas fa-download"></i> 导出行程
                    </button>
                </div>
            </div>
        `;

        const modal = document.getElementById('modal');
        const body = document.getElementById('modalBody');
        const modalContent = document.getElementById('modalContent');
        
        body.innerHTML = html;
        
        // 更新模态框样式以适应更大的内容
        if (modalContent) {
            modalContent.classList.add('large');
        }
        
        // 绑定查看地图按钮事件
        body.querySelectorAll('.view-on-map-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const location = btn.getAttribute('data-location');
                if (location) {
                    this.viewLocationOnMap(location);
                }
            });
        });
        
        // 绑定在地图上查看行程按钮事件
        const viewPlanBtn = body.querySelector('.view-plan-on-map-btn');
        if (viewPlanBtn) {
            viewPlanBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const planId = viewPlanBtn.getAttribute('data-plan-id');
                if (planId) {
                    this.viewPlanOnMap(planId);
                }
            });
        }
        
        // 绑定导出行程按钮事件
        const exportPlanBtn = body.querySelector('.export-plan-btn');
        if (exportPlanBtn) {
            exportPlanBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const planId = exportPlanBtn.getAttribute('data-plan-id');
                if (planId) {
                    this.exportPlan(planId);
                }
            });
        }
        
        modal.style.display = 'block';
    }

    // 在地图上查看位置
    viewLocationOnMap(location) {
        if (!location) {
            this.showMessage('地点信息为空', 'error');
            return;
        }

        console.log('查看地点:', location);

        // 关闭模态框
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.classList.remove('large');
            }
        }

        // 切换到地图页面
        this.showPage('map');

        // 等待地图初始化完成后再搜索
        const searchLocation = async () => {
            try {
                const searchInput = document.getElementById('mapSearchKeyword');
                if (!searchInput) {
                    // 如果输入框不存在，等待一下再试
                    setTimeout(searchLocation, 200);
                    return;
                }

                // 设置搜索关键词
                searchInput.value = location;

                // 等待地图初始化
                let attempts = 0;
                const maxAttempts = 50; // 最多等待5秒

                const waitForMap = () => {
                    return new Promise((resolve) => {
                        const checkMap = setInterval(() => {
                            attempts++;
                            if (this.map && window.AMap && this.map.getSize) {
                                clearInterval(checkMap);
                                resolve(true);
                            } else if (attempts >= maxAttempts) {
                                clearInterval(checkMap);
                                resolve(false);
                            }
                        }, 100);
                    });
                };

                const mapReady = await waitForMap();

                if (mapReady) {
                    // 地图已准备好，执行搜索
                    console.log('地图已准备好，开始搜索:', location);
                    await this.searchPOI();
                } else {
                    // 地图未加载，尝试初始化
                    console.log('地图未加载，尝试初始化...');
                    this.initMap().then(() => {
                        setTimeout(() => {
                            this.searchPOI();
                        }, 500);
                    }).catch((error) => {
                        console.error('地图初始化失败:', error);
                        this.showMessage('地图加载失败，请检查API Key配置', 'error');
                    });
                }
            } catch (error) {
                console.error('搜索地点失败:', error);
                this.showMessage('搜索地点失败: ' + error.message, 'error');
            }
        };

        // 延迟执行，确保页面切换完成
        setTimeout(searchLocation, 500);
    }

    // 在地图上查看整个行程
    async viewPlanOnMap(planId) {
        if (!planId) {
            this.showMessage('行程ID无效', 'error');
            return;
        }

        // 关闭模态框
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.classList.remove('large');
            }
        }

        // 切换到地图页面
        this.showPage('map');

        try {
            // 获取行程详情
            const response = await this.apiCall(`/travel/plan/${planId}`, 'GET');
            if (!response.ok) {
                this.showMessage('获取行程详情失败', 'error');
                return;
            }

            const data = await response.json();
            const plan = data.plan || {};
            const days = data.days || [];
            const actsByDay = data.activities_by_day || {};

            // 收集所有地点
            const locations = [];
            days.forEach(day => {
                const acts = actsByDay[day.id] || [];
                acts.forEach(act => {
                    if (act.location && !locations.includes(act.location)) {
                        locations.push(act.location);
                    }
                });
            });

            if (locations.length === 0) {
                this.showMessage('该行程没有地点信息', 'info');
                return;
            }

            // 等待地图初始化
            const loadLocationsOnMap = async () => {
                try {
                    // 等待地图准备就绪
                    let attempts = 0;
                    const maxAttempts = 50; // 最多等待5秒

                    const waitForMap = () => {
                        return new Promise((resolve) => {
                            const checkMap = setInterval(() => {
                                attempts++;
                                if (this.map && window.AMap && this.map.getSize) {
                                    clearInterval(checkMap);
                                    resolve(true);
                                } else if (attempts >= maxAttempts) {
                                    clearInterval(checkMap);
                                    resolve(false);
                                }
                            }, 100);
                        });
                    };

                    const mapReady = await waitForMap();

                    if (!mapReady) {
                        // 地图未加载，尝试初始化
                        console.log('地图未加载，尝试初始化...');
                        await this.initMap();
                        // 再等待一下
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    if (this.map && window.AMap) {
                        // 清除现有标记
                        this.clearMarkers();

                        // 批量搜索地点
                        let loadedCount = 0;
                        const promises = [];

                        locations.forEach((location, index) => {
                            const promise = new Promise((resolve) => {
                                setTimeout(async () => {
                                    try {
                                        await this.geocodeAddressForLocation(location, index === 0);
                                        loadedCount++;
                                        resolve();
                                    } catch (error) {
                                        console.error(`加载地点 ${location} 失败:`, error);
                                        resolve();
                                    }
                                }, index * 200); // 延迟加载，避免请求过快
                            });
                            promises.push(promise);
                        });

                        // 等待所有地点加载完成
                        await Promise.all(promises);
                        
                        // 如果有多个地点，调整地图视野以显示所有标记
                        if (locations.length > 1 && this.mapMarkers.length > 0) {
                            const bounds = new AMap.Bounds();
                            this.mapMarkers.forEach(marker => {
                                const position = marker.getPosition();
                                bounds.extend(position);
                            });
                            this.map.setBounds(bounds);
                        }

                        this.showMessage(`已加载 ${loadedCount}/${locations.length} 个地点`, 'success');
                    } else {
                        this.showMessage('地图加载失败，请检查API Key配置', 'error');
                    }
                } catch (error) {
                    console.error('加载地点失败:', error);
                    this.showMessage('加载地点失败: ' + error.message, 'error');
                }
            };

            this.showMessage(`正在加载 ${locations.length} 个地点...`, 'info');
            setTimeout(loadLocationsOnMap, 500);
        } catch (error) {
            console.error('加载行程地点失败:', error);
            this.showMessage('加载行程地点失败', 'error');
        }
    }

    // 地理编码地址并在地图上标记（不设置起点/终点）
    async geocodeAddressForLocation(location, centerMap = false) {
        if (!location) return;

        try {
            const apiKey = await this.getAmapApiKey();
            if (apiKey) {
                // 直接调用高德地图API
                const url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(location)}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
                    const geocode = data.geocodes[0];
                    const [lng, lat] = geocode.location.split(',').map(Number);
                    
                    if (this.map) {
                        // 添加标记
                        this.addMarker([lng, lat], location, 'default');
                        
                        // 如果是第一个地点，居中显示
                        if (centerMap) {
                            this.map.setCenter([lng, lat]);
                            this.map.setZoom(13);
                        }
                    }
                    return { lng, lat, location };
                }
            } else if (this.token) {
                // 通过后端API
                const response = await this.apiCall('/map/geocode', 'POST', { address: location });
                if (response.ok) {
                    const data = await response.json();
                    if (data.geocodes && data.geocodes.length > 0) {
                        const geocode = data.geocodes[0];
                        const [lng, lat] = geocode.location.split(',').map(Number);
                        
                        if (this.map) {
                            this.addMarker([lng, lat], location, 'default');
                            if (centerMap) {
                                this.map.setCenter([lng, lat]);
                                this.map.setZoom(13);
                            }
                        }
                        return { lng, lat, location };
                    }
                }
            }
        } catch (error) {
            console.error('地理编码失败:', error);
        }
        return null;
    }

    // 导出行程
    exportPlan(planId) {
        this.showMessage('导出功能开发中...', 'info');
        // TODO: 实现行程导出功能
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // 自动附带OpenAI配置到请求头，便于后端兜底获取
        try {
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            if (settings.openaiApiKey) {
                options.headers['X-OpenAI-API-Key'] = settings.openaiApiKey;
            }
            if (settings.openaiBaseUrl) {
                options.headers['X-OpenAI-Base-URL'] = settings.openaiBaseUrl;
            }
            if (settings.openaiModel) {
                options.headers['X-OpenAI-Model'] = settings.openaiModel;
            }
        } catch (e) {}

        if (data) {
            options.body = JSON.stringify(data);
        }

        return fetch(`${this.apiBase}${endpoint}`, options);
    }

    showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    showLoading(button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading"></span> 处理中...';
    }

    hideLoading(button) {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-magic"></i> 生成AI行程';
    }

    // 清除字段错误状态
    clearFieldErrors() {
        const fields = ['destination', 'startDate', 'endDate', 'budget', 'people'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.remove('error');
            }
        });
    }

    // 高亮错误字段
    highlightErrorFields(errorFields) {
        errorFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('error');
                field.focus();
            }
        });
    }

    // 切换个人中心标签页
    switchProfileTab(tab) {
        // 更新标签按钮状态
        document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // 显示对应内容
        document.querySelectorAll('.profile-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        if (tab === 'info') {
            document.getElementById('profileInfoTab').classList.add('active');
        } else if (tab === 'settings') {
            document.getElementById('profileSettingsTab').classList.add('active');
        }
    }

    // 加载设置
    async loadSettings() {
        try {
            // 先从localStorage加载
            const localSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            if (localSettings.openaiApiKey) {
                document.getElementById('openaiApiKey').value = localSettings.openaiApiKey;
            }
            if (localSettings.openaiBaseUrl) {
                document.getElementById('openaiBaseUrl').value = localSettings.openaiBaseUrl;
            }
            if (localSettings.openaiModel) {
                const modelInput = document.getElementById('openaiModel');
                if (modelInput) modelInput.value = localSettings.openaiModel;
            }
            if (localSettings.amapApiKey) {
                document.getElementById('amapApiKey').value = localSettings.amapApiKey;
            }

            // 如果已登录，从后端加载设置
            if (this.token) {
                try {
                    const response = await this.apiCall('/settings', 'GET');
                    if (response.ok) {
                        const data = await response.json();
                        const settings = data.settings || {};
                        
                        // 更新OpenAI设置（如果后端有完整值）
                        if (settings.openai_base_url) {
                            document.getElementById('openaiBaseUrl').value = settings.openai_base_url;
                        }
                        if (settings.openai_model) {
                            const modelInput = document.getElementById('openaiModel');
                            if (modelInput) modelInput.value = settings.openai_model;
                        }
                        
                        // 更新高德地图API Key（后端返回完整值）
                        if (settings.amap_api_key) {
                            document.getElementById('amapApiKey').value = settings.amap_api_key;
                            // 同时更新localStorage
                            const updatedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
                            updatedSettings.amapApiKey = settings.amap_api_key;
                            localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
                        }
                    }
                } catch (error) {
                    console.warn('从后端加载设置失败:', error);
                }
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    // 保存设置
    async saveSettings() {
        const apiKey = document.getElementById('openaiApiKey').value.trim();
        const baseUrl = document.getElementById('openaiBaseUrl').value.trim() || 'https://api.openai.com/v1';
        const model = (document.getElementById('openaiModel')?.value || '').trim();

        if (!apiKey) {
            this.showApiKeyStatus('请输入OpenAI API Key', 'error');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showApiKeyStatus('API Key格式不正确，应以sk-开头', 'error');
            return;
        }

        try {
            // 保存到localStorage
            const localSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            localSettings.openaiApiKey = apiKey;
            localSettings.openaiBaseUrl = baseUrl;
            localSettings.openaiModel = model;
            localSettings.savedAt = new Date().toISOString();
            localStorage.setItem('userSettings', JSON.stringify(localSettings));

            // 如果已登录，也保存到后端
            if (this.token) {
                try {
                    await this.apiCall('/settings', 'PUT', {
                        openai_api_key: apiKey,
                        openai_base_url: baseUrl,
                        openai_model: model
                    });
                } catch (error) {
                    console.warn('保存到后端失败，已保存到本地:', error);
                }
            }

            this.showApiKeyStatus('设置已保存成功！', 'success');
            
            // 更新LLM服务配置（如果服务支持动态更新）
            this.updateLLMConfig(apiKey, baseUrl);
        } catch (error) {
            this.showApiKeyStatus('保存设置失败: ' + error.message, 'error');
        }
    }

    // 保存高德地图设置
    async saveAmapSettings() {
        const amapApiKey = document.getElementById('amapApiKey').value.trim();

        if (!amapApiKey) {
            this.showAmapApiKeyStatus('请输入高德地图API Key', 'error');
            return;
        }

        try {
            // 保存到localStorage
            const localSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            localSettings.amapApiKey = amapApiKey;
            localSettings.amapSavedAt = new Date().toISOString();
            localStorage.setItem('userSettings', JSON.stringify(localSettings));

            // 如果已登录，也保存到后端
            if (this.token) {
                try {
                    await this.apiCall('/settings', 'PUT', {
                        amap_api_key: amapApiKey
                    });
                } catch (error) {
                    console.warn('保存到后端失败，已保存到本地:', error);
                }
            }

            this.showAmapApiKeyStatus('地图设置已保存成功！', 'success');
        } catch (error) {
            this.showAmapApiKeyStatus('保存设置失败: ' + error.message, 'error');
        }
    }

    // 测试高德地图API Key
    async testAmapApiKey() {
        const amapApiKey = document.getElementById('amapApiKey').value.trim();

        if (!amapApiKey) {
            this.showAmapApiKeyStatus('请先输入高德地图API Key', 'error');
            return;
        }

        this.showAmapApiKeyStatus('正在测试连接...', 'info');
        document.getElementById('testAmapApiKeyBtn').disabled = true;

        try {
            // 直接调用高德地图API测试Key
            const testUrl = `https://restapi.amap.com/v3/geocode/geo?key=${amapApiKey}&address=北京市`;
            const response = await fetch(testUrl);
            const data = await response.json();

            if (data.status === '1') {
                this.showAmapApiKeyStatus('✓ 高德地图API Key验证成功！连接正常', 'success');
            } else {
                this.showAmapApiKeyStatus('✗ 验证失败: ' + (data.info || 'API Key无效或网络错误'), 'error');
            }
        } catch (error) {
            this.showAmapApiKeyStatus('✗ 测试失败: ' + error.message, 'error');
        } finally {
            document.getElementById('testAmapApiKeyBtn').disabled = false;
        }
    }

    // 显示高德地图API Key状态
    showAmapApiKeyStatus(message, type) {
        const statusDiv = document.getElementById('amapApiKeyStatus');
        statusDiv.textContent = message;
        statusDiv.className = `api-key-status ${type} show`;
        
        setTimeout(() => {
            statusDiv.classList.remove('show');
        }, 5000);
    }

    // 测试API Key
    async testApiKey() {
        const apiKey = document.getElementById('openaiApiKey').value.trim();
        const baseUrl = document.getElementById('openaiBaseUrl').value.trim() || 'https://api.openai.com/v1';

        if (!apiKey) {
            this.showApiKeyStatus('请先输入OpenAI API Key', 'error');
            return;
        }

        this.showApiKeyStatus('正在测试连接...', 'info');
        document.getElementById('testApiKeyBtn').disabled = true;

        try {
            // 调用后端测试接口
            const response = await fetch(`${this.apiBase}/settings/test-api-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token ? `Bearer ${this.token}` : ''
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    base_url: baseUrl
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showApiKeyStatus('✓ API Key验证成功！连接正常', 'success');
            } else {
                this.showApiKeyStatus('✗ 验证失败: ' + (data.error || '未知错误'), 'error');
            }
        } catch (error) {
            this.showApiKeyStatus('✗ 测试失败: ' + error.message, 'error');
        } finally {
            document.getElementById('testApiKeyBtn').disabled = false;
        }
    }

    // 显示API Key状态
    showApiKeyStatus(message, type) {
        const statusDiv = document.getElementById('apiKeyStatus');
        statusDiv.textContent = message;
        statusDiv.className = `api-key-status ${type} show`;
        
        setTimeout(() => {
            statusDiv.classList.remove('show');
        }, 5000);
    }

    // 更新LLM配置（用于后续API调用）
    updateLLMConfig(apiKey, baseUrl) {
        // 将配置存储，供后续API调用使用
        this.llmConfig = {
            apiKey: apiKey,
            baseUrl: baseUrl
        };
    }

    // 获取用户配置的API Key（优先使用用户配置）
    getUserApiKey() {
        try {
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            return settings.openaiApiKey || null;
        } catch (error) {
            return null;
        }
    }

    // 初始化地图
    async initMap() {
        // 检查地图容器是否存在
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            console.error('地图容器不存在');
            this.showMessage('地图容器未找到', 'error');
            return;
        }

        // 显示加载状态
        const mapLoading = document.getElementById('mapLoading');
        const mapError = document.getElementById('mapError');
        if (mapLoading) mapLoading.style.display = 'block';
        if (mapError) mapError.style.display = 'none';

        // 如果地图已初始化，刷新地图尺寸
        if (this.map) {
            // 隐藏加载状态
            if (mapLoading) mapLoading.style.display = 'none';
            // 等待容器可见后再刷新地图尺寸
            setTimeout(() => {
                if (this.map) {
                    try {
                        this.map.resize(); // 重新调整地图尺寸
                    } catch (e) {
                        console.warn('刷新地图尺寸失败:', e);
                    }
                }
            }, 100);
            return;
        }

        try {
            // 确保容器可见且有尺寸
            const mapPage = document.getElementById('map');
            if (mapPage && !mapPage.classList.contains('active')) {
                // 如果地图页面未激活，等待一下
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // 动态加载高德地图SDK
            if (!this.amapLoaded) {
                await this.loadAmapSDK();
            }

            // 检查AMap是否已加载
            if (!window.AMap) {
                if (mapLoading) mapLoading.style.display = 'none';
                if (mapError) mapError.style.display = 'block';
                this.showMessage('高德地图SDK加载失败，请检查网络连接或API Key配置', 'error');
                return;
            }

            // 再次检查容器是否存在且可见
            if (!mapContainer || mapContainer.offsetHeight === 0) {
                console.warn('地图容器不可见，等待显示...');
                // 等待容器显示
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // 创建地图实例
            // 确保容器有明确的尺寸
            if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
                console.warn('地图容器尺寸为0，等待容器渲染...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            this.map = new AMap.Map('mapContainer', {
                zoom: 13,
                center: [116.397428, 39.90923], // 默认北京天安门
                viewMode: '3D',
                resizeEnable: true, // 启用自动适应容器尺寸变化
                mapStyle: 'amap://styles/normal' // 使用标准地图样式
            });

            // 等待地图加载完成
            this.map.on('complete', () => {
                console.log('地图加载完成');
                // 隐藏加载状态
                if (mapLoading) mapLoading.style.display = 'none';
                if (mapError) mapError.style.display = 'none';
                this.showMessage('地图加载成功', 'success');
            });

            // 地图加载错误
            this.map.on('error', (e) => {
                console.error('地图加载错误:', e);
                if (mapLoading) mapLoading.style.display = 'none';
                if (mapError) mapError.style.display = 'block';
                this.showMessage('地图加载失败: ' + (e.message || '未知错误'), 'error');
            });

            // 添加地图控件
            try {
                this.map.addControl(new AMap.Scale());
                this.map.addControl(new AMap.ToolBar({
                    position: 'RT' // 右上角
                }));
            } catch (e) {
                console.warn('添加地图控件失败:', e);
            }

            // 地图点击事件
            this.map.on('click', (e) => {
                this.onMapClick(e);
            });
        } catch (error) {
            console.error('地图初始化失败:', error);
            if (mapLoading) mapLoading.style.display = 'none';
            if (mapError) mapError.style.display = 'block';
            this.showMessage('地图初始化失败: ' + (error.message || error), 'error');
        }
    }

    // 动态加载高德地图SDK
    loadAmapSDK() {
        return new Promise((resolve, reject) => {
            if (window.AMap) {
                this.amapLoaded = true;
                resolve();
                return;
            }

            // 从后端获取高德地图API Key
            this.getAmapApiKey().then(apiKey => {
                if (!apiKey) {
                    const errorMsg = '高德地图API Key未配置，请前往"个人中心" → "设置" → "高德地图API配置"中配置API Key';
                    // 显示错误提示
                    const mapLoading = document.getElementById('mapLoading');
                    const mapError = document.getElementById('mapError');
                    if (mapLoading) mapLoading.style.display = 'none';
                    if (mapError) {
                        mapError.style.display = 'block';
                        const hint = mapError.querySelector('.map-error-hint');
                        if (hint) {
                            hint.textContent = '请前往"个人中心" → "设置" → "高德地图API配置"中配置API Key';
                        }
                    }
                    this.showMessage(errorMsg, 'error');
                    reject(new Error('API Key not configured'));
                    return;
                }

                // 检查是否已经加载过SDK
                const existingScript = document.querySelector('script[src*="webapi.amap.com"]');
                if (existingScript && window.AMap) {
                    console.log('高德地图SDK已加载');
                    this.amapLoaded = true;
                    resolve();
                    return;
                }

                // 如果存在旧脚本但AMap未加载，移除旧脚本
                if (existingScript) {
                    existingScript.remove();
                }

                // 生成唯一的回调函数名，避免冲突
                const callbackName = 'onAmapLoaded_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                console.log('开始加载高德地图SDK，API Key:', apiKey.substring(0, 8) + '...');
                
                // 设置全局回调函数
                window[callbackName] = () => {
                    console.log('高德地图SDK回调触发');
                    // 等待AMap对象完全初始化
                    const checkInterval = setInterval(() => {
                        if (window.AMap && typeof window.AMap.Map === 'function') {
                            clearInterval(checkInterval);
                            clearTimeout(timeout);
                            console.log('高德地图SDK加载成功');
                            this.amapLoaded = true;
                            delete window[callbackName];
                            resolve();
                        }
                    }, 50);

                    // 超时检查
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        if (!window.AMap || typeof window.AMap.Map !== 'function') {
                            delete window[callbackName];
                            const error = new Error('AMap对象初始化失败');
                            reject(error);
                        }
                    }, 3000);
                };

                // 创建脚本标签 - 使用1.4.15版本（更稳定，不需要安全密钥）
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = `https://webapi.amap.com/maps?v=1.4.15&key=${apiKey}&callback=${callbackName}`;
                
                script.onerror = (error) => {
                    clearTimeout(timeout);
                    delete window[callbackName];
                    console.error('高德地图SDK脚本加载失败:', error);
                    const mapLoading = document.getElementById('mapLoading');
                    const mapError = document.getElementById('mapError');
                    if (mapLoading) mapLoading.style.display = 'none';
                    if (mapError) {
                        mapError.style.display = 'block';
                        const hint = mapError.querySelector('.map-error-hint');
                        if (hint) {
                            hint.innerHTML = '请检查：<br>1. API Key是否正确（需要使用JS API Key）<br>2. 网络连接是否正常<br>3. 浏览器控制台是否有错误信息';
                        }
                    }
                    this.showMessage('高德地图SDK加载失败，请检查API Key类型和网络连接', 'error');
                    reject(new Error('Failed to load AMap SDK script'));
                };

                // 设置超时（15秒）
                const timeout = setTimeout(() => {
                    if (!window.AMap || typeof window.AMap.Map !== 'function') {
                        delete window[callbackName];
                        if (script.parentNode) {
                            script.remove();
                        }
                        const mapLoading = document.getElementById('mapLoading');
                        const mapError = document.getElementById('mapError');
                        if (mapLoading) mapLoading.style.display = 'none';
                        if (mapError) {
                            mapError.style.display = 'block';
                            const hint = mapError.querySelector('.map-error-hint');
                            if (hint) {
                                hint.innerHTML = 'SDK加载超时，请检查：<br>1. API Key是否正确<br>2. 网络连接<br>3. 浏览器是否阻止了脚本加载';
                            }
                        }
                        this.showMessage('高德地图SDK加载超时', 'error');
                        reject(new Error('AMap SDK load timeout'));
                    }
                }, 15000);

                // 添加到页面
                document.head.appendChild(script);
                console.log('高德地图SDK脚本已添加到页面');
            }).catch((error) => {
                console.error('获取API Key失败:', error);
                reject(error);
            });
        });
    }

    // 从后端获取高德地图API Key（通过健康检查或配置接口）
    async getAmapApiKey() {
        try {
            // 优先从localStorage获取用户配置的高德地图API Key
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            if (settings.amapApiKey) {
                return settings.amapApiKey;
            }
            
            // 如果已登录，从后端获取用户设置中的API Key
            if (this.token) {
                try {
                    const response = await this.apiCall('/settings', 'GET');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.settings && data.settings.amap_api_key) {
                            // 保存到localStorage
                            settings.amapApiKey = data.settings.amap_api_key;
                            localStorage.setItem('userSettings', JSON.stringify(settings));
                            return data.settings.amap_api_key;
                        }
                    }
                } catch (error) {
                    console.warn('从后端获取设置失败:', error);
                }
            }
            
            // 最后尝试从后端系统配置获取（公开接口，不需要认证）
            try {
                const response = await fetch(`${this.apiBase}/map/api-key`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.apiKey) {
                        return data.apiKey;
                    }
                }
            } catch (error) {
                console.warn('从后端系统配置获取API Key失败:', error);
            }
        } catch (error) {
            console.warn('获取高德地图API Key失败:', error);
        }
        return null;
    }

    // 地图点击事件
    onMapClick(e) {
        const lng = e.lnglat.getLng();
        const lat = e.lnglat.getLat();
        // 可以在这里添加标记或更新起点/终点
    }

    // 地理编码：地址转坐标
    async geocodeAddress(type) {
        const inputId = type === 'origin' ? 'mapOrigin' : 'mapDestination';
        const address = document.getElementById(inputId).value.trim();
        if (!address) {
            this.showMessage('请输入地址', 'error');
            return;
        }

        try {
            // 优先使用用户配置的API Key直接调用高德地图API
            const apiKey = await this.getAmapApiKey();
            if (apiKey) {
                // 直接调用高德地图API
                const url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(address)}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
                    const geocode = data.geocodes[0];
                    const [lng, lat] = geocode.location.split(',').map(Number);
                    if (this.map) {
                        this.map.setCenter([lng, lat]);
                        this.map.setZoom(15);
                        this.addMarker([lng, lat], geocode.formatted_address, type);
                    }
                    this.showMessage('地址解析成功', 'success');
                    return;
                } else {
                    this.showMessage(data.info || '未找到该地址', 'error');
                    return;
                }
            }

            // 如果没有API Key，尝试通过后端API（需要登录）
            if (!this.token) {
                this.showMessage('请先配置高德地图API Key或登录后使用', 'error');
                return;
            }

            const response = await this.apiCall('/map/geocode', 'POST', { address });
            if (response.ok) {
                const data = await response.json();
                if (data.geocodes && data.geocodes.length > 0) {
                    const geocode = data.geocodes[0];
                    const [lng, lat] = geocode.location.split(',').map(Number);
                    if (this.map) {
                        this.map.setCenter([lng, lat]);
                        this.map.setZoom(15);
                        this.addMarker([lng, lat], geocode.formatted_address, type);
                    }
                    this.showMessage('地址解析成功', 'success');
                } else {
                    this.showMessage('未找到该地址', 'error');
                }
            } else {
                const error = await response.json();
                this.showMessage(error.error || '地址解析失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    // 添加地图标记
    addMarker(position, title, type = 'default') {
        if (!this.map) return;

        const icon = type === 'origin' ? 'https://webapi.amap.com/theme/v1.3/markers/n/start.png' :
                     type === 'destination' ? 'https://webapi.amap.com/theme/v1.3/markers/n/end.png' :
                     'https://webapi.amap.com/theme/v1.3/markers/n/mid.png';

        const marker = new AMap.Marker({
            position: position,
            title: title,
            icon: new AMap.Icon({
                image: icon,
                size: new AMap.Size(32, 32),
                imageSize: new AMap.Size(32, 32)
            })
        });

        marker.setMap(this.map);
        this.mapMarkers.push(marker);
    }

    // POI搜索
    async searchPOI() {
        const keyword = document.getElementById('mapSearchKeyword').value.trim();
        if (!keyword) {
            this.showMessage('请输入搜索关键词', 'error');
            return;
        }

        try {
            // 优先使用用户配置的API Key直接调用高德地图API
            const apiKey = await this.getAmapApiKey();
            if (apiKey) {
                // 直接调用高德地图API
                const url = `https://restapi.amap.com/v3/place/text?key=${apiKey}&keywords=${encodeURIComponent(keyword)}&offset=20&page=1&extensions=all`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.status === '1') {
                    this.displayPOIResults(data.pois || []);
                    return;
                } else {
                    this.showMessage(data.info || '搜索失败', 'error');
                    return;
                }
            }

            // 如果没有API Key，尝试通过后端API（需要登录）
            if (!this.token) {
                this.showMessage('请先配置高德地图API Key或登录后使用', 'error');
                return;
            }

            const response = await this.apiCall('/map/search-poi', 'POST', { keyword });
            if (response.ok) {
                const data = await response.json();
                this.displayPOIResults(data.pois || []);
            } else {
                const error = await response.json();
                this.showMessage(error.error || '搜索失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    // 显示POI搜索结果
    displayPOIResults(pois) {
        const container = document.getElementById('mapPOIList');
        if (!pois || pois.length === 0) {
            container.innerHTML = '<p>未找到相关地点</p>';
            return;
        }

        container.innerHTML = pois.map(poi => {
            const [lng, lat] = poi.location.split(',').map(Number);
            return `
                <div class="poi-item" data-lng="${lng}" data-lat="${lat}">
                    <h4>${poi.name}</h4>
                    <p>${poi.address || ''}</p>
                    <p class="poi-type">${poi.type || ''}</p>
                    <button class="btn btn-small btn-outline" onclick="app.selectPOI(${lng}, ${lat}, '${poi.name}')">
                        选择
                    </button>
                </div>
            `;
        }).join('');

        // 在地图上标记POI
        this.clearMarkers();
        pois.forEach(poi => {
            const [lng, lat] = poi.location.split(',').map(Number);
            this.addMarker([lng, lat], poi.name);
        });

        // 如果有点，缩放到合适范围
        if (pois.length > 0) {
            const bounds = new AMap.Bounds();
            pois.forEach(poi => {
                const [lng, lat] = poi.location.split(',').map(Number);
                bounds.extend([lng, lat]);
            });
            this.map.setBounds(bounds);
        }
    }

    // 选择POI
    selectPOI(lng, lat, name) {
        this.map.setCenter([lng, lat]);
        this.map.setZoom(15);
        this.showMessage(`已选择: ${name}`, 'success');
    }

    // 路线规划
    async planRoute() {
        const origin = document.getElementById('mapOrigin').value.trim();
        const destination = document.getElementById('mapDestination').value.trim();

        if (!origin || !destination) {
            this.showMessage('请填写起点和终点', 'error');
            return;
        }

        try {
            // 获取API Key
            const apiKey = await this.getAmapApiKey();
            
            // 辅助函数：地理编码地址
            const geocodeAddress = async (address) => {
                if (apiKey) {
                    // 直接调用高德地图API
                    const url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(address)}`;
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
                        return { ok: true, geocodes: data.geocodes };
                    }
                    return { ok: false, error: data.info || '地址解析失败' };
                } else if (this.token) {
                    // 通过后端API
                    const response = await this.apiCall('/map/geocode', 'POST', { address });
                    if (response.ok) {
                        const data = await response.json();
                        return { ok: true, geocodes: data.geocodes };
                    }
                    const error = await response.json();
                    return { ok: false, error: error.error || '地址解析失败' };
                } else {
                    return { ok: false, error: '请先配置高德地图API Key或登录后使用' };
                }
            };

            // 先进行地理编码，获取坐标
            const originGeocode = await geocodeAddress(origin);
            const destGeocode = await geocodeAddress(destination);

            if (!originGeocode.ok || !destGeocode.ok) {
                const error = originGeocode.error || destGeocode.error || '地址解析失败';
                this.showMessage(error, 'error');
                return;
            }

            const originLoc = originGeocode.geocodes[0].location;
            const destLoc = destGeocode.geocodes[0].location;

            // 规划路线
            if (apiKey) {
                // 直接调用高德地图API
                const routeType = this.mapMode === 'driving' ? 'driving' : 
                                 this.mapMode === 'walking' ? 'walking' : 'transit';
                let routeUrl = '';
                if (routeType === 'transit') {
                    routeUrl = `https://restapi.amap.com/v3/direction/transit/integrated?key=${apiKey}&origin=${originLoc}&destination=${destLoc}`;
                } else {
                    routeUrl = `https://restapi.amap.com/v3/direction/${routeType}?key=${apiKey}&origin=${originLoc}&destination=${destLoc}`;
                }
                
                const response = await fetch(routeUrl);
                const data = await response.json();
                
                if (data.status === '1') {
                    this.displayRoute(data.route, originLoc, destLoc);
                } else {
                    this.showMessage(data.info || '路线规划失败', 'error');
                }
            } else if (this.token) {
                // 通过后端API
                const response = await this.apiCall('/map/route', 'POST', {
                    origin: originLoc,
                    destination: destLoc,
                    mode: this.mapMode,
                    city: ''
                });

                if (response.ok) {
                    const data = await response.json();
                    this.displayRoute(data.route, originLoc, destLoc);
                } else {
                    const error = await response.json();
                    this.showMessage(error.error || '路线规划失败', 'error');
                }
            } else {
                this.showMessage('请先配置高德地图API Key或登录后使用', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    // 显示路线
    displayRoute(routeData, originLoc, destLoc) {
        if (!this.map || !routeData.paths || routeData.paths.length === 0) {
            this.showMessage('未找到路线', 'error');
            return;
        }

        // 清除之前的路线
        if (this.mapRoute) {
            this.map.remove(this.mapRoute);
            this.mapRoute = null;
        }

        const path = routeData.paths[0];
        
        // 解析路线坐标点
        let route = [];
        if (path.steps && path.steps.length > 0) {
            // 从steps中提取polyline
            path.steps.forEach(step => {
                if (step.polyline) {
                    const points = step.polyline.split(';').map(point => {
                        const coords = point.split(',');
                        if (coords.length === 2) {
                            const lng = parseFloat(coords[0]);
                            const lat = parseFloat(coords[1]);
                            if (!isNaN(lng) && !isNaN(lat)) {
                                return [lng, lat];
                            }
                        }
                        return null;
                    }).filter(p => p !== null);
                    route = route.concat(points);
                }
            });
        }

        // 如果没有从steps中提取到路线，尝试从path的其他字段获取
        if (route.length === 0 && path.steps && path.steps.length > 0) {
            // 使用起点和终点作为简单路线
            const [originLng, originLat] = originLoc.split(',').map(Number);
            const [destLng, destLat] = destLoc.split(',').map(Number);
            route = [[originLng, originLat], [destLng, destLat]];
        }

        // 绘制路线
        if (route.length > 0) {
            this.mapRoute = new AMap.Polyline({
                path: route,
                strokeColor: '#3366FF',
                strokeWeight: 6,
                strokeOpacity: 0.8
            });
            this.map.add(this.mapRoute);
        }

        // 添加起点和终点标记
        const [originLng, originLat] = originLoc.split(',').map(Number);
        const [destLng, destLat] = destLoc.split(',').map(Number);
        this.clearMarkers();
        this.addMarker([originLng, originLat], '起点', 'origin');
        this.addMarker([destLng, destLat], '终点', 'destination');

        // 显示路线信息
        const distance = path.distance ? (parseFloat(path.distance) / 1000).toFixed(2) : '未知';
        const duration = path.duration ? (parseFloat(path.duration) / 60).toFixed(0) : '未知';
        const routeInfo = document.getElementById('mapRouteInfo');
        const routeDetails = document.getElementById('mapRouteDetails');
        routeInfo.style.display = 'block';
        
        const stepsHtml = path.steps && path.steps.length > 0 
            ? `<div class="route-steps">
                <h5>路线步骤：</h5>
                <ol>
                    ${path.steps.map(step => `<li>${step.instruction || step.road || '路线步骤'}</li>`).join('')}
                </ol>
            </div>`
            : '';
        
        routeDetails.innerHTML = `
            <p><strong>距离：</strong>${distance} 公里</p>
            <p><strong>时间：</strong>约 ${duration} 分钟</p>
            <p><strong>方式：</strong>${this.mapMode === 'driving' ? '驾车' : this.mapMode === 'walking' ? '步行' : '公交'}</p>
            ${stepsHtml}
        `;

        // 调整地图视野
        const bounds = new AMap.Bounds();
        bounds.extend([originLng, originLat]);
        bounds.extend([destLng, destLat]);
        this.map.setBounds(bounds);

        this.showMessage('路线规划成功', 'success');
    }

    // 清除地图标记和路线
    clearMap() {
        this.clearMarkers();
        if (this.mapRoute) {
            this.map.remove(this.mapRoute);
            this.mapRoute = null;
        }
        document.getElementById('mapOrigin').value = '';
        document.getElementById('mapDestination').value = '';
        document.getElementById('mapSearchKeyword').value = '';
        document.getElementById('mapRouteInfo').style.display = 'none';
        document.getElementById('mapPOIList').innerHTML = '';
        this.showMessage('地图已清除', 'success');
    }

    // 清除标记
    clearMarkers() {
        this.mapMarkers.forEach(marker => {
            this.map.remove(marker);
        });
        this.mapMarkers = [];
    }

}

// 初始化应用
const app = new TravelPlannerApp();
