import os
from fpdf import FPDF

class OnboardingPDF(FPDF):
    def __init__(self, title_text):
        super().__init__()
        self.title_text = title_text
        self.set_auto_page_break(auto=True, margin=15)
        
    def header(self):
        # Top banner background (deep slate blue)
        self.set_fill_color(30, 41, 59)
        self.rect(0, 0, 210, 30, 'F')
        
        # Sienvi Agency logo/text
        self.set_xy(15, 8)
        self.set_font('helvetica', 'B', 14)
        self.set_text_color(255, 255, 255)
        self.cell(0, 6, "SIENVI AGENCY", ln=1)
        
        # Subtitle
        self.set_xy(15, 15)
        self.set_font('helvetica', '', 9)
        self.set_text_color(148, 163, 184)
        self.cell(0, 5, "Onboarding & Discovery Program", ln=1)
        
        self.set_y(35)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        
        # Horizontal line
        self.set_draw_color(226, 232, 240)
        self.line(15, self.get_y(), 195, self.get_y())
        
        self.set_y(-12)
        self.cell(100, 10, "Confidential - Sienvi Agency © 2026", border=0, align='L')
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', border=0, align='R')

    def add_form_title(self, text):
        self.set_y(38)
        self.set_font('helvetica', 'B', 20)
        self.set_text_color(15, 23, 42) # Slate 900
        self.cell(0, 10, text, ln=1)
        
        # Accent line under title
        self.set_draw_color(37, 99, 235) # Blue 600
        self.set_line_width(1)
        self.line(15, self.get_y() + 1, 80, self.get_y() + 1)
        self.ln(8)

    def add_section_header(self, text):
        # Add space before section if not at the start
        if self.get_y() > 55:
            self.ln(6)
            
        # Keep section header with at least some content below it
        if self.get_y() > 250:
            self.add_page()
            
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(255, 255, 255)
        self.set_fill_color(37, 99, 235) # Blue 600
        self.cell(0, 8, f"   {text}", fill=True, ln=1)
        self.ln(4)

    def add_field(self, label, placeholder, is_required=False, is_textarea=False):
        # Keep together to avoid splitting label and its box
        height = 30 if is_textarea else 18
        if self.get_y() + height > 270:
            self.add_page()
            
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(51, 65, 85) # Slate 700
        
        req_star = " *" if is_required else ""
        self.cell(0, 5, f"{label}{req_star}", ln=1)
        
        # Input box
        self.set_draw_color(203, 213, 225) # Slate 300
        self.set_fill_color(248, 250, 252) # Slate 50
        
        x = self.get_x()
        y = self.get_y()
        
        if is_textarea:
            self.rect(x, y, 180, 20, 'FD')
            self.set_font('helvetica', 'I', 9)
            self.set_text_color(148, 163, 184)
            self.set_xy(x + 3, y + 2)
            self.multi_cell(174, 5, placeholder)
            self.set_xy(x, y + 20)
        else:
            self.rect(x, y, 180, 8, 'FD')
            self.set_font('helvetica', 'I', 9)
            self.set_text_color(148, 163, 184)
            self.set_xy(x + 3, y + 1.5)
            self.cell(174, 5, placeholder)
            self.set_xy(x, y + 8)
            
        self.ln(4)

    def add_bullet_options(self, label, options, is_required=False):
        if self.get_y() + (len(options) * 6) + 10 > 270:
            self.add_page()
            
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(51, 65, 85)
        req_star = " *" if is_required else ""
        self.cell(0, 5, f"{label}{req_star}", ln=1)
        
        self.set_font('helvetica', '', 9)
        self.set_text_color(71, 85, 105)
        
        # Print options side-by-side or stacked
        for opt in options:
            self.cell(5, 5, "") # Indent
            self.set_draw_color(148, 163, 184)
            self.set_fill_color(255, 255, 255)
            # Draw empty checkbox
            x = self.get_x()
            y = self.get_y() + 1
            self.rect(x, y, 3, 3)
            self.set_xy(x + 5, y - 1)
            self.cell(0, 5, opt, ln=1)
        self.ln(2)

def generate_goals_pdf(output_dir):
    pdf = OnboardingPDF("SMART Goals Sheet")
    pdf.add_page()
    pdf.add_form_title("SMART Goals Sheet")
    
    pdf.set_font('helvetica', '', 9.5)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, "This worksheet helps you set goals that are Specific, Measurable, Achievable, Relevant, and Time-bound. Take approximately 30-60 minutes to complete this thoroughly.")
    pdf.ln(4)
    
    pdf.add_section_header("Goal Identification")
    pdf.add_field("Describe Your Primary Goal", "e.g., Increase monthly sales by 20% through improved marketing automation...", is_required=True, is_textarea=True)
    
    pdf.add_section_header("Specific (S)")
    pdf.add_field("What exactly do you want to achieve?", "Provide a clear, detailed description of what success looks like...", is_required=True, is_textarea=True)
    pdf.add_field("Who is involved?", "List key people, team members, or external organizations involved...", is_textarea=False)
    pdf.add_field("Where will this be achieved?", "Specific context, location, online channels, or platforms...", is_textarea=False)
    pdf.add_field("Why is this goal important?", "Describe the core purpose, benefits, and reasons for pursuing this goal...", is_required=True, is_textarea=True)
    pdf.add_field("Specific Goal Summary", "Synthesize the answers above into a specific goal statement...", is_textarea=True)
    
    pdf.add_section_header("Measurable (M)")
    pdf.add_field("How will you measure progress?", "Identify specific metrics, data points, or KPIs you will track...", is_required=True, is_textarea=True)
    pdf.add_field("What is the quantifiable target?", "e.g., 20% increase, 100 new signups, $50k monthly revenue...", is_required=True, is_textarea=False)
    pdf.add_field("Measurable Goal Summary", "Summarize how progress will be measured...", is_textarea=True)
    
    pdf.add_section_header("Achievable (A)")
    pdf.add_field("Is the goal realistic?", "Evaluate your resources, constraints, and capabilities to ensure it's realistic...", is_required=True, is_textarea=True)
    pdf.add_field("What steps are necessary?", "List the key high-level milestones or activities required...", is_required=True, is_textarea=True)
    pdf.add_field("Achievable Goal Summary", "Summarize the feasibility...", is_textarea=True)
    
    pdf.add_section_header("Relevant (R)")
    pdf.add_field("Does this goal align with your broader objectives?", "Connect this goal to your long-term business strategy, values, or mission...", is_required=True, is_textarea=True)
    pdf.add_field("Why is it worthwhile?", "Explain why this is the right time and focus for your resources...", is_required=True, is_textarea=True)
    pdf.add_field("Relevant Goal Summary", "Summarize alignment...", is_textarea=True)
    
    pdf.add_section_header("Time-Bound (T)")
    pdf.add_field("What is the deadline for achieving this goal?", "e.g., December 31, 2024...", is_required=True, is_textarea=False)
    pdf.add_field("What milestones will you set?", "Break down the timeline into check-in points...", is_required=True, is_textarea=True)
    pdf.add_field("Time-bound Goal Summary", "Summarize the timeline...", is_textarea=True)
    
    pdf.add_section_header("Goal Summary (Narrative)")
    pdf.add_field("Your Complete Goal Summary", "Write a clear, cohesive narrative paragraph that integrates all SMART criteria...", is_required=True, is_textarea=True)
    
    pdf.add_section_header("Action Plan Steps")
    pdf.add_field("Action Item 1", "What needs to be done?", is_textarea=False)
    pdf.add_field("Responsible Person & Deadline", "Who will do it and by when?", is_textarea=False)
    pdf.add_field("Resources Needed", "Tools, budget, or access needed...", is_textarea=False)
    
    pdf.add_section_header("Potential Obstacles & Solutions")
    pdf.add_field("Anticipated Obstacle", "What challenge might you face?", is_textarea=True)
    pdf.add_field("Possible Solution", "How will you overcome this challenge?", is_textarea=True)
    
    path = os.path.join(output_dir, "1_SMART_Goals_Sheet.pdf")
    pdf.output(path)
    print(f"Generated: {path}")

def generate_avatars_pdf(output_dir):
    pdf = OnboardingPDF("Customer Avatar Profile")
    pdf.add_page()
    pdf.add_form_title("Customer Avatar Profile")
    
    pdf.set_font('helvetica', '', 9.5)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, "This profile helps us create brand-aligned content, campaigns, and website experiences that speak directly to the people who matter most to your business.")
    pdf.ln(4)
    
    pdf.add_section_header("Overview of Your Audience")
    pdf.add_field("What product(s) or service(s) are you currently selling?", "Describe your primary offerings and their price points...", is_required=True, is_textarea=True)
    
    # Avatar Template
    pdf.add_section_header("Customer Avatar Template")
    pdf.set_font('helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, "1. Demographics", ln=1)
    pdf.ln(2)
    pdf.add_field("Avatar Name/Label", "e.g., 'Busy Mom Sarah'...", is_required=True, is_textarea=False)
    pdf.add_field("Age Range & Gender", "e.g., 30-45, primarily Female...", is_textarea=False)
    pdf.add_field("Location", "e.g., USA, remote...", is_textarea=False)
    pdf.add_field("Education Level & Family Status", "e.g., College graduate, married with 2 kids...", is_textarea=False)
    pdf.add_field("Occupation & Income Level", "e.g., Marketing Director, $90k/year...", is_textarea=False)
    
    pdf.ln(2)
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(0, 6, "2. Psychographics", ln=1)
    pdf.ln(2)
    pdf.add_field("Goals or aspirations?", "What do they want to achieve?", is_textarea=True)
    pdf.add_field("Problems, frustrations, or pain points?", "What keeps them up at night?", is_textarea=True)
    pdf.add_field("Fears of inaction?", "What happens if they don't solve this?", is_textarea=True)
    pdf.add_field("Core beliefs?", "Beliefs they hold about solving the issue...", is_textarea=True)
    
    pdf.ln(2)
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(0, 6, "3. Buying Behavior", ln=1)
    pdf.ln(2)
    pdf.add_field("Where do they typically hang out online?", "Social media platforms, blogs, podcasts...", is_textarea=True)
    pdf.add_field("Resonating content or language?", "Tone, style, short-form vs. long-form...", is_textarea=True)
    pdf.add_field("Objections or hesitations?", "Price, trust, implementation time...", is_textarea=True)
    pdf.add_field("What would make them say 'yes' faster?", "Guarantees, social proof...", is_textarea=True)
    
    pdf.ln(2)
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(0, 6, "4. Customer Journey", ln=1)
    pdf.ln(2)
    pdf.add_field("Where are they in their journey when they first find you?", "Researching? Ready to buy?", is_textarea=True)
    pdf.add_field("How do they usually find you?", "Search, ads, referrals...", is_textarea=True)
    pdf.add_field("What transformation do they want most?", "Desired 'after' state...", is_textarea=True)
    
    pdf.add_section_header("Final Notes")
    pdf.add_field("Which avatar is MOST important for your business right now?", "Name of the primary target avatar...", is_textarea=False)
    pdf.add_field("Why is this avatar most important?", "Highest profit margins, easiest to close...", is_textarea=True)
    pdf.add_bullet_options("Do you have existing customer data or testimonials?", ["Yes, testimonials/data available", "No, starting from scratch"], is_required=False)
    pdf.add_field("Customers to AVOID", "Describe red-flag clients or customers...", is_textarea=True)
    
    path = os.path.join(output_dir, "2_Customer_Avatar_Profile.pdf")
    pdf.output(path)
    print(f"Generated: {path}")

def generate_general_questionnaire_pdf(output_dir):
    pdf = OnboardingPDF("General Onboarding Questionnaire")
    pdf.add_page()
    pdf.add_form_title("Onboarding Questionnaire")
    
    pdf.set_font('helvetica', '', 9.5)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, "This comprehensive questionnaire helps us tailor our services to your specific needs. Take your time to provide detailed answers.")
    pdf.ln(4)
    
    pdf.add_section_header("Section 1: Business Overview")
    pdf.add_field("Business Name", "Your business name...", is_required=True, is_textarea=False)
    pdf.add_field("Industry or Niche", "e.g., E-commerce, SaaS...", is_required=True, is_textarea=False)
    pdf.add_field("Business Description", "Provide a brief description of what you do...", is_required=True, is_textarea=True)
    pdf.add_field("Years Operating", "How long have you been operating?", is_textarea=False)
    pdf.add_field("Revenue Goals", "Monthly/Annual goals...", is_textarea=False)
    pdf.add_field("Target Audience", "Who is your target audience?", is_required=True, is_textarea=True)
    pdf.add_field("Revenue Streams", "What are your primary revenue streams?", is_textarea=True)
    
    pdf.add_section_header("Section 2: Goals & Vision")
    pdf.add_field("Top 3 Goals", "Business goals for next 6-12 months...", is_required=True, is_textarea=True)
    pdf.add_field("Vision (3-5 Years)", "Your long-term vision...", is_textarea=True)
    pdf.add_field("Planned Launches", "Upcoming products/services...", is_textarea=True)
    pdf.add_field("What would a 'big win' look like?", "Successful outcome of this partnership...", is_required=True, is_textarea=True)
    
    pdf.add_section_header("Section 3: Challenges & Bottlenecks")
    pdf.add_field("Biggest Challenges", "Main pain points right now...", is_required=True, is_textarea=True)
    pdf.add_field("Stuck Areas", "Where do you feel overwhelmed?", is_textarea=True)
    pdf.add_field("Goal Blockers", "What's preventing you from reaching goals?", is_textarea=True)
    pdf.add_field("Past Agency Experience", "What worked/didn't work previously?", is_textarea=True)
    
    pdf.add_section_header("Section 4: Team, Tools & Systems")
    pdf.add_field("Team Structure", "List roles filled...", is_textarea=True)
    pdf.add_field("Marketing tools", "e.g. Canva, Buffer", is_textarea=False)
    pdf.add_field("CRM & email tools", "e.g. HubSpot, Mailchimp", is_textarea=False)
    pdf.add_field("Sales & funnel tools", "e.g. ClickFunnels, Stripe", is_textarea=False)
    pdf.add_field("Project management tools", "e.g. Asana, Notion", is_textarea=False)
    pdf.add_field("Performance Tracking", "How do you track performance?", is_textarea=True)
    pdf.add_field("Automation Needs", "Tasks you'd like to automate...", is_textarea=True)
    
    pdf.add_section_header("Section 5: Offers, Marketing & Sales")
    pdf.add_field("Core Offers", "Your main offerings...", is_required=True, is_textarea=True)
    pdf.add_field("Lead Acquisition", "How do you acquire leads?", is_textarea=True)
    pdf.add_field("Marketing Working", "What's working best?", is_textarea=True)
    pdf.add_field("Marketing Not Working", "What's inconsistent?", is_textarea=True)
    pdf.add_field("Existing Funnels", "Funnels/ads running...", is_textarea=True)
    
    pdf.add_section_header("Section 6: Content & Branding")
    pdf.add_field("Brand Identity Status", "Guidelines, visuals, tone details...", is_textarea=True)
    pdf.add_field("Content Creation", "Do you create content? What kind?", is_textarea=True)
    pdf.add_field("Important Platforms", "Platforms important for brand...", is_textarea=False)
    pdf.add_field("Assets to Review", "Website, design, copy assets...", is_textarea=True)
    
    pdf.add_section_header("Section 7: Decision-Making & Collaboration")
    pdf.add_field("Primary Contact", "Name and role...", is_required=True, is_textarea=False)
    pdf.add_field("Communication Preference", "e.g. Slack, email, weekly calls...", is_textarea=False)
    pdf.add_field("Decision Maker", "Are you the final decision-maker?", is_textarea=False)
    pdf.add_field("Ideal Collaboration", "Describe your ideal collaboration...", is_textarea=True)
    
    pdf.add_section_header("Section 8: Readiness & Expectations")
    pdf.add_field("Start Timeline", "When would you like to get started?", is_textarea=False)
    pdf.add_field("Budget/Timeline", "Budget range or deadlines...", is_textarea=False)
    pdf.add_field("Additional Notes", "Anything else we should know?", is_textarea=True)
    
    path = os.path.join(output_dir, "3_General_Onboarding_Questionnaire.pdf")
    pdf.output(path)
    print(f"Generated: {path}")

def generate_amazon_questionnaire_pdf(output_dir):
    pdf = OnboardingPDF("Amazon Listing Design Questionnaire")
    pdf.add_page()
    pdf.add_form_title("Amazon Listing Design Questionnaire")
    
    pdf.set_font('helvetica', '', 9.5)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, "This questionnaire helps us understand your product, brand, and goals so we can create high-converting Amazon listings.")
    pdf.ln(4)
    
    pdf.add_section_header("Section 1: Business & Brand Information")
    pdf.add_field("Business Name", "Your brand/business name...", is_required=True, is_textarea=False)
    pdf.add_field("Primary Contact Name", "Name of person coordinating design...", is_required=True, is_textarea=False)
    pdf.add_field("Email Address", "Email for design drafts...", is_required=True, is_textarea=False)
    pdf.add_bullet_options("Amazon Seller Account Type", ["Seller Central", "Vendor Central"], is_required=True)
    pdf.add_bullet_options("Target Marketplace(s)", ["USA", "Canada", "UK", "EU", "Other"], is_required=True)
    
    pdf.add_section_header("Section 2: Product Overview")
    pdf.add_field("Product Name", "Product we are optimizing...", is_required=True, is_textarea=False)
    pdf.add_field("Product Category", "e.g., Kitchen, Beauty...", is_required=True, is_textarea=False)
    pdf.add_field("ASIN (if live)", "Amazon Standard Identification Number...", is_textarea=False)
    pdf.add_bullet_options("Is this a new product or existing listing?", ["New Product", "Existing Listing"], is_required=True)
    pdf.add_field("Product Variations", "Size, color, pack variations...", is_textarea=True)
    
    pdf.add_section_header("Section 3: Product Details")
    pdf.add_field("Brief Description of Your Product", "What is the product?", is_required=True, is_textarea=True)
    pdf.add_field("Key Features", "List specifications/features...", is_required=True, is_textarea=True)
    pdf.add_field("Top 3 Benefits Your Customer Cares About Most", "Why do people buy it?", is_required=True, is_textarea=True)
    pdf.add_field("What Problem Does This Product Solve?", "Core pain point solved...", is_required=True, is_textarea=True)
    pdf.add_field("Materials, Specs, Ingredients", "Technical specifics...", is_textarea=True)
    pdf.add_field("Dimensions and Weight", "Size and weight...", is_textarea=False)
    
    pdf.add_section_header("Section 4: Target Customer")
    pdf.add_field("Who is Your Ideal Customer?", "Demographics, usage behavior...", is_required=True, is_textarea=True)
    pdf.add_field("Customer Pain Points", "Frustrations they have with other products...", is_textarea=True)
    pdf.add_field("Desired Outcome", "What outcome are they buying it for?", is_textarea=True)
    pdf.add_field("Customer Objections", "Sizing, price, material concerns...", is_textarea=True)
    
    pdf.add_section_header("Section 5: Brand Voice & Positioning")
    pdf.add_bullet_options("Brand Voice", ["Professional", "Friendly", "Bold", "Premium", "Minimalist", "Other"], is_required=True)
    pdf.add_field("Admired Brands", "Brands that inspire you...", is_textarea=True)
    pdf.add_field("Words to Associate", "Positive brand concepts...", is_textarea=True)
    pdf.add_field("Words to Avoid", "Unfavorable terms...", is_textarea=True)
    
    pdf.add_section_header("Section 6: Visual Style Preferences")
    pdf.add_bullet_options("Do you have brand guidelines?", ["Yes, guidelines exist", "No guidelines"], is_required=False)
    pdf.add_field("Preferred Colors & Fonts", "Visual specifications...", is_textarea=False)
    pdf.add_bullet_options("Style Preference", ["Clean & Minimalist", "Bold & High Contrast", "Lifestyle Focused", "Technical/Detailed"], is_required=False)
    pdf.add_field("Example Listings", "Links to listings you like...", is_textarea=True)
    
    pdf.add_section_header("Section 7: Competitors & Market Research")
    pdf.add_field("Top 3-5 Competitor ASINs or Listings", "Links/ASINs...", is_textarea=True)
    pdf.add_field("Competitor Likes", "What do you like about their listings?", is_textarea=True)
    pdf.add_field("Competitor Dislikes", "What do you want to avoid?", is_textarea=True)
    
    pdf.add_section_header("Section 8: Image & Creative Direction")
    pdf.add_field("Features to Highlight", "Must-show parts...", is_textarea=True)
    pdf.add_field("Mandatory Claims/Certs", "FDA, organic, warranty claims...", is_textarea=True)
    pdf.add_field("Compliance Restrictions", "Legal restrictions to note...", is_textarea=True)
    pdf.add_field("Image Styles to Avoid", "Visual concepts to exclude...", is_textarea=True)
    
    pdf.add_section_header("Section 9: Video Ad Preferences")
    pdf.add_bullet_options("Primary Goal of Videos", ["Conversions", "Brand Awareness", "Education"], is_required=False)
    pdf.add_field("Video Messaging", "Key slogans/messaging...", is_textarea=True)
    pdf.add_bullet_options("Video Tone", ["Emotional", "Informational", "Fast-Paced", "Calm"], is_required=False)
    pdf.add_field("Video Examples", "Reference video links...", is_textarea=True)
    
    pdf.add_section_header("Section 10: Approvals & Final Notes")
    pdf.add_field("Work Approver", "Name/role of final reviewer...", is_textarea=False)
    pdf.add_field("Turnaround Preference", "Feedback turnaround...", is_textarea=False)
    pdf.add_field("Additional Notes", "Anything else we should know?", is_textarea=True)
    
    path = os.path.join(output_dir, "4_Amazon_Listing_Design_Questionnaire.pdf")
    pdf.output(path)
    print(f"Generated: {path}")

def generate_advertising_questionnaire_pdf(output_dir):
    pdf = OnboardingPDF("Advertising Campaign Questionnaire")
    pdf.add_page()
    pdf.add_form_title("Advertising Campaign Questionnaire")
    
    pdf.set_font('helvetica', '', 9.5)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, "This questionnaire helps us create effective advertising campaigns tailored to your goals and budget.")
    pdf.ln(4)
    
    pdf.add_section_header("Section 1: Business & Campaign Overview")
    pdf.add_field("Business Name", "Your brand name...", is_required=True, is_textarea=False)
    pdf.add_field("Primary Contact Name", "Campaign coordinator name...", is_required=True, is_textarea=False)
    pdf.add_field("Email Address", "Email for reports...", is_required=True, is_textarea=False)
    pdf.add_field("Industry/Niche", "e.g., Supplements, SaaS...", is_required=True, is_textarea=False)
    
    pdf.add_section_header("Section 2: Advertising Channels")
    pdf.add_bullet_options("Interested Channels", [
        "Amazon Ads", "Google Ads", "Meta Ads", "TikTok Ads", "YouTube Ads", "Reddit Ads", "LinkedIn Ads"
    ], is_required=True)
    
    pdf.add_section_header("Section 3: Campaign Goals")
    pdf.add_bullet_options("Primary Campaign Goal", [
        "Brand Awareness", "Lead Generation", "Sales / Conversions", "Website Traffic", "Engagement"
    ], is_required=True)
    pdf.add_field("Target KPIs", "Metrics defining success (CPA, ROAS, leads/mo)...", is_required=True, is_textarea=True)
    pdf.add_bullet_options("Monthly Advertising Budget Range", [
        "Under $1,000 / month", "$1,000 - $5,000 / month", "$5,000 - $10,000 / month",
        "$10,000 - $25,000 / month", "$25,000 - $50,000 / month", "Over $50,000 / month"
    ], is_required=True)
    
    pdf.add_section_header("Section 4: Target Audience")
    pdf.add_field("Target Demographics", "Age groups, gender, income...", is_required=True, is_textarea=True)
    pdf.add_field("Target Locations", "Countries, states, cities...", is_required=True, is_textarea=False)
    pdf.add_field("Interests & Behaviors", "What interests define them?", is_textarea=True)
    pdf.add_field("Retargeting Audiences", "Pixel logs, customer lists...", is_textarea=True)
    
    pdf.add_section_header("Section 5: Current Advertising Status")
    pdf.add_field("Previous Advertising Experience", "Platforms used & results...", is_textarea=True)
    pdf.add_field("Current Ad Accounts", "List active accounts...", is_textarea=True)
    pdf.add_field("What Has Worked Well?", "Profitable angles...", is_textarea=True)
    pdf.add_field("What Has NOT Worked?", "Angles that failed...", is_textarea=True)
    
    pdf.add_section_header("Section 6: Creative & Messaging")
    pdf.add_bullet_options("Do you have existing ad creatives?", ["Yes, raw assets exist", "No, need design help"], is_required=False)
    pdf.add_field("Brand Voice & Tone", "e.g., authoritative, warm...", is_textarea=False)
    pdf.add_field("Key Messaging Points", "Taglines to focus on...", is_required=True, is_textarea=True)
    pdf.add_field("Unique Selling Propositions (USPs)", "Why should they buy from you?", is_required=True, is_textarea=True)
    pdf.add_field("Promotional Offers", "Discounts, coupons, free shipping...", is_textarea=True)
    
    pdf.add_section_header("Section 7: Landing Pages & Conversion")
    pdf.add_field("Landing Page URLs", "Provide URLs...", is_textarea=True)
    pdf.add_bullet_options("Is conversion tracking already set up?", ["Yes, pixels/GTM live", "No, need setup"], is_required=False)
    pdf.add_field("Conversion Actions to Track", "Purchases, leads, forms...", is_textarea=True)
    
    pdf.add_section_header("Section 8: Competitor Analysis")
    pdf.add_field("Main Competitors", "List top 3 competitors...", is_textarea=True)
    pdf.add_field("Competitor Ad Examples", "Links to competitor ads...", is_textarea=True)
    pdf.add_field("How Do You Want to Differentiate?", "Your advantage...", is_textarea=True)
    
    pdf.add_section_header("Section 9: Timeline & Expectations")
    pdf.add_field("Campaign Start Date", "Target date...", is_textarea=False)
    pdf.add_field("Campaign Duration", "e.g. ongoing, 3 months...", is_textarea=False)
    pdf.add_field("Expected Results Timeline", "CPA/ROAS achievement expectation...", is_textarea=False)
    pdf.add_field("Reporting Preferences", "e.g. weekly Slack, monthly Zoom...", is_textarea=False)
    
    pdf.add_section_header("Section 10: Assets & Access")
    pdf.add_field("Ad Account Access Details", "Meta ID, Google CID...", is_textarea=True)
    pdf.add_field("Creative Assets Available", "Links to Drive/Dropbox...", is_textarea=True)
    
    pdf.add_section_header("Section 11: Additional Information")
    pdf.add_field("Additional Notes", "Anything else we should know?", is_textarea=True)
    
    path = os.path.join(output_dir, "5_Advertising_Campaign_Questionnaire.pdf")
    pdf.output(path)
    print(f"Generated: {path}")

def generate_business_admin_pdf(output_dir):
    pdf = OnboardingPDF("Business Admin Onboarding Questionnaire")
    pdf.add_page()
    pdf.add_form_title("Non-Ecommerce / Business Admin Onboarding")
    
    pdf.set_font('helvetica', '', 9.5)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, "This questionnaire helps us understand your business, workflows, administrative needs, current bottlenecks, tools, and communication preferences so we can support you efficiently.")
    pdf.ln(4)
    
    pdf.add_section_header("Section 1: Business & Contact Information")
    pdf.add_field("Business Name", "Legal and/or operating business name...", is_required=True)
    pdf.add_field("Primary Contact Name", "Name of primary coordinator...", is_required=True)
    pdf.add_field("Role / Title", "Founder, CEO, Ops Manager, etc...", is_required=True)
    pdf.add_field("Email Address", "Primary contact email...", is_required=True)
    pdf.add_field("Phone / WhatsApp Number", "Contact number...", is_textarea=False)
    pdf.add_field("Website & Social Links", "Links to website and profiles...", is_textarea=False)
    pdf.add_field("Business Location & Time Zone", "Location and timezone...", is_required=True)
    pdf.add_field("Preferred Communication Method", "Email, Slack, WhatsApp, Project Management Tool...", is_required=True)
    pdf.add_field("Preferred Meeting Frequency", "Weekly, bi-weekly, monthly, as-needed...", is_textarea=False)
    
    pdf.add_section_header("Section 2: Business Overview")
    pdf.add_field("How would you describe your business?", "What you do, who you serve, and value proposition...", is_required=True, is_textarea=True)
    pdf.add_field("Industry / Niche", "e.g., Consulting, Coaching, Real Estate...", is_required=True)
    pdf.add_field("Years Operating", "Operating length...", is_textarea=False)
    pdf.add_field("Primary Services or Offers", "List services, packages, deliverables...", is_required=True, is_textarea=True)
    pdf.add_field("Primary Clients or Customers", "Briefly describe the clients you serve...", is_required=True, is_textarea=True)
    pdf.add_field("Current Revenue Streams", "Retainers, hourly, project work...", is_textarea=True)
    pdf.add_field("Business Stage", "Startup, scaling, growing, chaotic admin mode...", is_textarea=False)
    
    pdf.add_section_header("Section 3: Goals & Success Outcomes")
    pdf.add_field("Top 3 goals for the next 6-12 months", "1. Goal one\n2. Goal two\n3. Goal three", is_required=True, is_textarea=True)
    pdf.add_field("What would a successful partnership look like?", "Fewer missed follow-ups, clean inbox, organized CRM...", is_required=True, is_textarea=True)
    pdf.add_field("Specific outcomes wanted", "Save 10 hours/week, manage calendar, organize files...", is_required=True, is_textarea=True)
    pdf.add_field("How will we measure success?", "Response time, task completion rate, lead speed...", is_required=True, is_textarea=True)
    pdf.add_field("Deadlines, launches, or busy seasons?", "Upcoming events/busy periods...", is_textarea=True)
    pdf.add_field("Long-term vision (3-5 years)", "Where do you want the business to be?", is_textarea=True)
    
    pdf.add_section_header("Section 4: Current Challenges & Bottlenecks")
    pdf.add_field("Biggest administrative challenges?", "Repetitive tasks, stress points, slow workflows...", is_required=True, is_textarea=True)
    pdf.add_field("Where are you personally spending too much time?", "Emails, invoicing, file organization, data entry...", is_required=True, is_textarea=True)
    pdf.add_field("What is falling through the cracks?", "Missed emails, delayed invoices...", is_textarea=True)
    pdf.add_field("What processes are unclear or undocumented?", "SOP needs...", is_textarea=True)
    pdf.add_field("Prevention factors?", "What keeps operations from scaling smoothly?", is_textarea=True)
    pdf.add_field("Previous admin/VA experience?", "What worked? What didn't?", is_textarea=True)
    pdf.add_field("What tasks do you want to delegate immediately?", "Tasks stealing CEO energy...", is_required=True, is_textarea=True)
    
    pdf.add_section_header("Section 5: Admin Support Needs")
    pdf.add_bullet_options("Which services do you need help with?", [
        "Inbox management", "Calendar management", "Appointment scheduling", "Client onboarding/offboarding",
        "CRM management", "Lead tracking", "Data entry", "File organization", "SOP creation", "Project management",
        "Reporting / dashboards", "Invoice / Billing support", "Contract / proposal support", "Travel / personal support"
    ], is_required=True)
    pdf.add_field("Highest Priority Tasks", "Top 3-5 immediate needs...", is_required=True, is_textarea=True)
    pdf.add_field("Recurring Tasks", "Daily, weekly, monthly tasks...", is_textarea=True)
    pdf.add_field("One-Time Cleanup Projects", "Inbox sorting, folder structuring...", is_textarea=True)
    pdf.add_field("Tasks Sienvi should NOT handle", "Financial approvals, sensitive HR, legal decisions...", is_textarea=True)
    
    pdf.add_section_header("Section 6: Workflow & Operations")
    pdf.add_field("Describe your lead-to-delivery workflow", "Step-by-step walk through of what happens...", is_required=True, is_textarea=True)
    pdf.add_bullet_options("Do you have documented SOPs?", ["Yes, fully documented", "Partially documented", "No documented SOPs"], is_required=True)
    pdf.add_field("SOP Storage location", "Google Drive, Notion, ClickUp, Loom...", is_textarea=False)
    pdf.add_field("What processes need SOPs first?", "First documentation targets...", is_textarea=True)
    pdf.add_field("How are tasks assigned and tracked?", "ClickUp, Asana, Monday, spreadsheet, memory...", is_required=True)
    pdf.add_field("Recurring check-ins/meetings?", "Meeting schedule...", is_textarea=True)
    pdf.add_field("Required approval steps?", "Steps needed before sending items...", is_textarea=True)
    pdf.add_field("Final operational decision-maker?", "Who signs off on admin items?", is_textarea=False)
    
    pdf.add_section_header("Section 7: Tools, Platforms & Access")
    pdf.add_field("Communication & PM Tools used", "Slack, ClickUp, Asana, Notion, WhatsApp...", is_textarea=True)
    pdf.add_field("CRM & Invoicing Tools used", "HubSpot, GHL, Dubsado, Stripe, QuickBooks...", is_textarea=True)
    pdf.add_field("Tools needing cleanup or connection", "Integration or organization needs...", is_textarea=True)
    pdf.add_field("Access Method & Password Manager", "Direct invite, Password manager details...", is_textarea=True)
    
    pdf.add_section_header("Section 8: Customer Communication")
    pdf.add_field("Who do you communicate with?", "Clients, leads, team, partners...", is_textarea=True)
    pdf.add_field("Types of messages received most", "Inquiries, billing, support, complains...", is_textarea=True)
    pdf.add_field("Email templates availability", "Yes / No / Partially...", is_textarea=False)
    pdf.add_field("Desired communication tone", "Professional, warm, concise, causal, corporate...", is_required=True)
    pdf.add_field("Phrases to avoid & approval rules", "What requires CEO approval before sending?", is_required=True, is_textarea=True)
    pdf.add_field("Desired response time", "Same day, 24 hours, 48 hours...", is_textarea=False)
    
    pdf.add_section_header("Section 9: Sales, Leads & Follow-Up")
    pdf.add_field("Lead source details", "Website form, referrals, social media, ads...", is_textarea=True)
    pdf.add_field("Lead tracking & sales pipeline structure", "Where are leads stored? What are the sales stages?", is_textarea=True)
    pdf.add_field("Help needed with follow-ups / proposals?", "Describe contract, proposal, or onboarding support...", is_textarea=True)
    pdf.add_field("Lead qualification criteria & red flags", "What defines a good vs. bad lead?", is_textarea=True)
    
    pdf.add_section_header("Section 10: Calendar & Scheduling")
    pdf.add_field("Who manages calendar? Appointment types?", "Internal calls, client calls, vendor syncs...", is_textarea=True)
    pdf.add_field("Working hours, protected times, focus rules", "Calendly limitations, time zone rules...", is_textarea=True)
    pdf.add_field("Meetings requiring prep materials or notes?", "Meeting requirements...", is_textarea=True)
    pdf.add_field("Scheduling links and preferences", "URLs and buffer time preferences...", is_textarea=True)
    
    pdf.add_section_header("Section 11: Documents, Files & Organization")
    pdf.add_field("File Storage location", "Google Drive, Dropbox, OneDrive, Notion...", is_required=True)
    pdf.add_field("Current organization level", "Very organized, somewhat, digital junk drawer...", is_textarea=False)
    pdf.add_field("File categories & structure requests", "Clients, finance, operations, templates...", is_textarea=True)
    pdf.add_field("Repeated documents, template formatting needs", "Proposals, contracts, reports to standardize...", is_textarea=True)
    
    pdf.add_section_header("Section 12: Reporting & Performance")
    pdf.add_field("KPIs tracked & tracking location", "Revenue, lead response times, spreadsheet location...", is_textarea=True)
    pdf.add_field("Reports needed, recipients, & frequency", "Weekly summaries, monthly revenue reports...", is_textarea=True)
    pdf.add_field("What does leadership need at a glance?", "Key insights required...", is_textarea=True)
    
    pdf.add_section_header("Section 13: Finance & Billing Support")
    pdf.add_field("Invoice support & billing tools used", "QuickBooks, Stripe, invoicing schedule...", is_textarea=True)
    pdf.add_field("Invoice approver & overdue reminders script", "Reminders cadence, scripts details...", is_textarea=True)
    pdf.add_field("Financial tasks Sienvi should not touch", "Restricted banking, payment approvals...", is_textarea=True)
    
    pdf.add_section_header("Section 14: Team & Vendor Coordination")
    pdf.add_field("Team structure, contractors, & communication rules", "Roles, vendor list, team communication...", is_textarea=True)
    pdf.add_field("Task assignment & coordination support needed?", "Daily reminders, PM tracking support...", is_textarea=True)
    
    pdf.add_section_header("Section 15: Brand, Voice & Standards")
    pdf.add_field("Guidelines & brand sounds", "How should your company sound in writing?", is_required=True, is_textarea=True)
    pdf.add_field("Visual guidelines or templates", "Website links, brand assets...", is_textarea=False)
    pdf.add_field("Communication standards mattered most", "Speed, accuracy, warmth, detail, initiative...", is_textarea=True)
    pdf.add_field("Legal, compliance, privacy, or NDA constraints", "GDPR, HIPAA, NDA agreements...", is_textarea=True)
    
    pdf.add_section_header("Section 16: Access & Security")
    pdf.add_field("Systems access list & access invitation process", "Invitations, passwords, shared admin invites...", is_required=True, is_textarea=True)
    pdf.add_field("Restricted files, two-factor auth, revoking access", "Restricted logins, backup codes, revoking SOP...", is_textarea=True)
    
    pdf.add_section_header("Section 17: Collaboration & Feedback")
    pdf.add_field("Final Decision-Maker", "Name & role of final approver...", is_required=True)
    pdf.add_field("Feedback loop preference", "Loom videos, comment threads, direct email, Slack...", is_textarea=True)
    pdf.add_field("Turnaround expectations", "Client review times vs. agency execution times...", is_textarea=True)
    pdf.add_field("Urgent request handling & partner worries", "How should emergencies be run?", is_textarea=True)
    
    pdf.add_section_header("Section 18: Priorities & First 30 Days")
    pdf.add_field("What should Sienvi fix first?", "The biggest bottleneck...", is_required=True, is_textarea=True)
    pdf.add_field("First 7 days priorities", "SOP review, immediate tasks...", is_textarea=True)
    pdf.add_field("First 30 days goals & success indicator", "What makes month 1 worth it?", is_required=True, is_textarea=True)
    pdf.add_field("Immediate fires & upcoming deadlines", "Urgent tasks to tackle...", is_textarea=True)
    
    pdf.add_section_header("Section 19: Assets & Links")
    pdf.add_field("Drive, Project Management, CRM, Scheduling URLs", "Enter links to your systems...", is_textarea=True)
    pdf.add_field("Brand Assets, Templates, Reports URLs", "Enter assets links...", is_textarea=True)
    
    pdf.add_section_header("Section 20: Final Notes")
    pdf.add_field("Additional details / context / boundaries", "Final instructions or boundaries...", is_textarea=True)
    
    path = os.path.join(output_dir, "6_Business_Admin_Onboarding_Questionnaire.pdf")
    pdf.output(path)
    print(f"Generated: {path}")

def generate_general_discovery_pdf(output_dir):
    pdf = OnboardingPDF("General Client Onboarding & Discovery Questionnaire")
    pdf.add_page()
    pdf.add_form_title("General Onboarding & Discovery")
    
    pdf.set_font('helvetica', '', 9.5)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, "This form helps Sienvi Agency understand your business, goals, audience, offers, challenges, current systems, and project needs so we can create a clear strategy.")
    pdf.ln(4)
    
    pdf.add_section_header("Section 1: Basic Business Information")
    pdf.add_field("Business Name", "Your legal or operating business name...", is_required=True)
    pdf.add_field("Primary Contact Name", "Name of primary contact...", is_required=True)
    pdf.add_field("Role / Title", "Founder, CEO, Marketing Manager, etc...", is_required=True)
    pdf.add_field("Email Address", "Primary contact email...", is_required=True)
    pdf.add_field("Phone / WhatsApp & Website URL", "Contact details...", is_textarea=False)
    pdf.add_field("Social Media Links", "Instagram, Facebook, LinkedIn, TikTok, etc...", is_textarea=False)
    pdf.add_field("Business Location & Time Zone", "Location and timezone...", is_required=True)
    pdf.add_field("Preferred Communication Method", "Email, Slack, WhatsApp, Project management...", is_required=True)
    pdf.add_field("Who will be the main point of contact?", "Name, role, and email...", is_required=True)
    pdf.add_field("Are you the final decision-maker?", "Yes / No. If no, list other decision-makers...", is_required=True)
    
    pdf.add_section_header("Section 2: Business Overview")
    pdf.add_field("How would you describe your business?", "What you do, who you serve, and value proposition...", is_required=True, is_textarea=True)
    pdf.add_field("What industry or niche are you in?", "e.g. ecommerce, coaching, legal, SaaS...", is_required=True)
    pdf.add_field("How long operating & current business stage?", "Years operating, stage (early growth, scaling)...", is_required=True)
    pdf.add_field("What do you currently sell or offer?", "Products, services, retainers, programs...", is_required=True, is_textarea=True)
    pdf.add_field("Primary revenue streams & pricing structure", "Price ranges, one-time fees, subscriptions...", is_textarea=True)
    pdf.add_field("What makes your business different?", "Competitive advantages...", is_textarea=True)
    
    pdf.add_section_header("Section 3: Goals & Vision")
    pdf.add_field("Top 3 goals for next 6-12 months", "1. ...\n2. ...\n3. ...", is_required=True, is_textarea=True)
    pdf.add_field("What is your primary goal from working with Sienvi?", "Increase leads, improve conversions, organize operations...", is_required=True, is_textarea=True)
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(0, 5, "Primary Goal details (SMART Framework):", ln=1)
    pdf.ln(2)
    pdf.add_field("Specific", "What exactly do you want to achieve?", is_required=True, is_textarea=True)
    pdf.add_field("Measurable", "What numbers, KPIs, or results define success?", is_required=True, is_textarea=True)
    pdf.add_field("Achievable", "What resources, team, or budget do you have?", is_required=True, is_textarea=True)
    pdf.add_field("Relevant", "Why does this goal matter right now?", is_required=True, is_textarea=True)
    pdf.add_field("Time-bound", "What is your deadline or ideal timeline?", is_required=True, is_textarea=False)
    pdf.add_field("What would a 'big win' look like?", "100 qualified leads/month, 3x ROAS, 10 hrs saved...", is_required=True, is_textarea=True)
    pdf.add_field("Bigger 3-5 year vision", "Where do you want to lead the business?", is_textarea=True)
    pdf.add_field("Major upcoming launches, campaigns, or deadlines", "Launches calendar details...", is_textarea=True)
    
    pdf.add_section_header("Section 4: Challenges & Bottlenecks")
    pdf.add_field("What are the biggest challenges right now?", "Marketing, sales, operations, systems...", is_required=True, is_textarea=True)
    pdf.add_field("Where do you feel stuck or overwhelmed?", "Pain points...", is_required=True, is_textarea=True)
    pdf.add_field("What is preventing you from reaching goals faster?", "Blockers...", is_textarea=True)
    pdf.add_field("What tasks are taking too much of your time?", "Time sinks...", is_textarea=True)
    pdf.add_field("What is inconsistent or not working?", "Underperforming channels...", is_textarea=True)
    pdf.add_field("Worked with agencies/freelancers before?", "What worked and what didn't?", is_textarea=True)
    pdf.add_field("What do you want to avoid in this partnership?", "Agency red flags...", is_textarea=True)
    
    pdf.add_section_header("Section 5: Target Audience & Customer Profile")
    pdf.add_field("Who is your ideal customer or client?", "Ideal demographics, interests...", is_required=True, is_textarea=True)
    pdf.add_bullet_options("Is your audience B2C, B2B, or both?", ["B2C", "B2B", "Both"], is_required=False)
    pdf.add_field("What are their biggest goals / desires?", "What do they want to achieve?", is_textarea=True)
    pdf.add_field("What problems, frustrations, or pain points do they have?", "Audience pain points...", is_required=True, is_textarea=True)
    pdf.add_field("Fears of inaction & objections", "Fears if they don't solve, objections (price, trust, time)...", is_textarea=True)
    pdf.add_field("Where does your audience spend time online?", "Google, Instagram, LinkedIn, YouTube, communities...", is_textarea=True)
    pdf.add_field("How do they find you? Most valuable type?", "Current discovery, highest profit/easiest to close details...", is_required=True, is_textarea=True)
    pdf.add_field("Client types you want to avoid", "Red flags...", is_textarea=True)
    
    pdf.add_section_header("Section 6: Offers & Positioning")
    pdf.add_field("What are your core offers, products, or services?", "List each with descriptions...", is_required=True, is_textarea=True)
    pdf.add_field("Which offer is most important to grow right now?", "Growth priority offer details...", is_required=True, is_textarea=True)
    pdf.add_field("Most profitable vs. easiest to sell vs. needing improvement", "Offer segmentation analysis...", is_textarea=True)
    pdf.add_field("Transformation / outcome (before vs. after)", "Customer transformation details...", is_textarea=True)
    pdf.add_field("Strongest selling points & unique advantages", "Why buy from you?", is_textarea=True)
    pdf.add_field("Proof of work & Guarantees", "Testimonials, case studies, risk reversers...", is_textarea=True)
    pdf.add_field("Claims or promises we should avoid", "Compliance restrictions...", is_textarea=True)
    
    pdf.add_section_header("Section 7: Marketing & Sales")
    pdf.add_field("How are you currently acquiring leads?", "Paid ads, organic social, SEO, referrals, outreach...", is_required=True, is_textarea=True)
    pdf.add_field("Marketing channels performance breakdown", "What's working vs. inconsistent...", is_textarea=True)
    pdf.add_bullet_options("Do you run paid advertising?", ["Yes", "No"], is_required=False)
    pdf.add_field("If yes, list platforms", "Meta, Google, TikTok, Amazon, etc...", is_textarea=False)
    pdf.add_field("Funnels, landing pages, or sequences active?", "Active funnels details...", is_textarea=True)
    pdf.add_field("Current sales process & drop-off points", "How leads close, where they drop off...", is_textarea=True)
    pdf.add_field("Metrics tracked, discounts & top 3 competitors", "Close rates, discount usage, competitors URLs...", is_textarea=True)
    
    pdf.add_section_header("Section 8: Brand & Creative Direction")
    pdf.add_bullet_options("Do you have a clear brand identity?", ["Yes, guidelines exist", "No brand guidelines"], is_required=True)
    pdf.add_field("How would you describe your brand voice?", "Professional, friendly, bold, luxury, casual, playful...", is_required=True)
    pdf.add_field("Brand associations & words/styles to avoid", "Associated terms vs. styles to avoid...", is_textarea=True)
    pdf.add_field("Admired brands & existing content assets", "Inspiring brands, photos, videos available...", is_textarea=True)
    pdf.add_field("Design, copy, ads, or strategy help needed?", "Fulfillment support requirements...", is_textarea=True)
    
    pdf.add_section_header("Section 9: Operations, Admin & Systems")
    pdf.add_field("List tools used (PM, CRM, Scheduling, Comm, Storage, Invoicing, Zapier)", "Asana, Hubspot, Calendly, Slack, Drive, Stripe...", is_textarea=True)
    pdf.add_field("What systems feel messy or hard to manage?", "Operational bottlenecks...", is_textarea=True)
    pdf.add_bullet_options("Do you have documented SOPs?", ["Yes", "Partially", "No"], is_required=False)
    pdf.add_field("Recurring tasks, automation needs, & admin support", "Tasks to automate or delegate...", is_textarea=True)
    
    pdf.add_section_header("Section 10: Project Scope & Support Needed")
    pdf.add_bullet_options("Support types requested", [
        "Business/Marketing strategy", "Paid advertising", "Social media & content",
        "Design & Website support", "Copywriting & Email marketing", "CRM & Automations",
        "Admin & EA support", "Ops cleanup", "Product/listing optimization"
    ], is_required=True)
    pdf.add_field("Top 3 priorities Sienvi should focus on first", "1. ...\n2. ...\n3. ...", is_required=True, is_textarea=True)
    pdf.add_field("First 7 days vs. First 30 days success indicators", "Short-term expectations, urgent fires...", is_textarea=True)
    
    pdf.add_section_header("Section 11: Assets, Access & Links")
    pdf.add_field("URLs (Website, Drive folder, brand assets, logos, PM workspace)", "Enter workspace URLs...", is_textarea=True)
    pdf.add_field("Platforms access list & access method", "Invites, Password manager, compliance constraints...", is_required=True, is_textarea=True)
    
    pdf.add_section_header("Section 12: Collaboration & Approvals")
    pdf.add_field("Collaboration preference & update frequency", "Slack async, weekly zoom, frequency...", is_required=True)
    pdf.add_field("Who approves work before it goes live?", "Reviewer details...", is_required=True)
    pdf.add_field("Turnaround time expectations & relationship notes", "Feedback turnaround preference, frustrations...", is_textarea=True)
    
    pdf.add_section_header("Section 13: Timeline, Budget & Expectations")
    pdf.add_field("When would you like to get started?", "Start date...", is_required=True)
    pdf.add_field("Project timeline & budget range", "One-time, monthly, budget parameters...", is_textarea=False)
    pdf.add_field("Result timeline & success confidence indicators", "When progress should show, what boosts confidence...", is_textarea=True)
    
    pdf.add_section_header("Section 14: Final Notes")
    pdf.add_field("Additional details / context", "Anything else Sienvi should know?", is_textarea=True)
    pdf.add_field("Excited vs. Worried", "What are you most excited vs. worried about?", is_textarea=True)
    
    pdf.add_section_header("Internal Agency Review Checklist (Agency Only)")
    pdf.add_field("Client Type & Main Bottleneck", "Ecommerce / Service / Coach / SaaS, main issues...", is_textarea=False)
    pdf.add_field("Top 3 Priorities & Opportunity", "Checklist priorities...", is_textarea=True)
    pdf.add_field("Clarity checks", "Audience, Offer, Brand, Systems (Strong/Moderate/Weak)...", is_textarea=False)
    pdf.add_field("Access Readiness & Recommended Actions", "First 7/30 days, red flags, upsells...", is_textarea=True)
    
    path = os.path.join(output_dir, "7_General_Discovery_Questionnaire.pdf")
    pdf.output(path)
    print(f"Generated: {path}")

if __name__ == "__main__":
    output_directory = "c:\\Users\\Iris\\OneDrive\\Work\\sienvi-agency-landing-page\\onboarding_forms_pdf"
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
        
    generate_goals_pdf(output_directory)
    generate_avatars_pdf(output_directory)
    generate_general_questionnaire_pdf(output_directory)
    generate_amazon_questionnaire_pdf(output_directory)
    generate_advertising_questionnaire_pdf(output_directory)
    generate_business_admin_pdf(output_directory)
    generate_general_discovery_pdf(output_directory)
    print("All onboarding form PDFs generated successfully!")
