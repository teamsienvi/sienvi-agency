import os
from fpdf import FPDF

class ContractPDF(FPDF):
    def __init__(self, subtitle="Client Service Agreement"):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)
        self.subtitle = subtitle
        
    def header(self):
        # Top banner background (deep slate blue)
        self.set_fill_color(30, 41, 59)
        self.rect(0, 0, 210, 30, 'F')
        
        # Sienvi Agency logo/text
        self.set_xy(15, 8)
        self.set_font('helvetica', 'B', 14)
        self.set_text_color(255, 255, 255)
        # Using new_x and new_y to avoid deprecation warnings
        self.cell(0, 6, "SIENVI AGENCY", new_x="LMARGIN", new_y="NEXT")
        
        # Subtitle
        self.set_xy(15, 15)
        self.set_font('helvetica', '', 9)
        self.set_text_color(148, 163, 184)
        self.cell(0, 5, self.subtitle, new_x="LMARGIN", new_y="NEXT")
        
        self.set_y(35)

    def footer(self):
        self.set_y(-20)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        
        # Horizontal line
        self.set_draw_color(226, 232, 240)
        self.line(15, self.get_y(), 195, self.get_y())
        
        self.set_y(-15)
        self.cell(100, 10, "Confidential - Sienvi Agency © 2026", border=0, align='L')
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', border=0, align='R')

def generate_general_pdf(output_paths):
    pdf = ContractPDF(subtitle="Client Service Agreement")
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # Document Title
    pdf.set_y(40)
    pdf.set_font('helvetica', 'B', 20)
    pdf.set_text_color(15, 23, 42) # Slate 900
    pdf.cell(0, 10, "Client Service Agreement", new_x="LMARGIN", new_y="NEXT")
    
    # Accent line under title
    pdf.set_draw_color(37, 99, 235) # Blue 600
    pdf.set_line_width(1)
    pdf.line(15, pdf.get_y() + 1, 95, pdf.get_y() + 1)
    pdf.ln(10)
    
    # Intro
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(51, 65, 85) # Slate 700
    intro_text = (
        "This Service Agreement (\"Agreement\") is entered into between SIENVI Agency "
        "(\"Provider\") and the undersigned client (\"Client\")."
    )
    pdf.multi_cell(0, 6, intro_text)
    pdf.ln(6)
    
    # Sections
    sections = [
        ("1. Services", 
         "Provider agrees to deliver the services as outlined in the selected plan, "
         "including but not limited to digital marketing, automation, and related "
         "consulting services."),
        
        ("2. Payment Terms", 
         "Client agrees to pay the agreed-upon monthly subscription fee via the "
         "payment method on file. Payments are processed automatically on each "
         "billing cycle."),
        
        ("3. Term and Termination", 
         "This Agreement remains in effect for the duration of the subscription. "
         "Either party may terminate with 30 days written notice."),
        
        ("4. Confidentiality", 
         "Both parties agree to maintain confidentiality of proprietary information "
         "shared during the course of this engagement."),
        
        ("5. Limitation of Liability", 
         "Provider's liability shall be limited to the fees paid by Client in the "
         "12 months preceding any claim."),
        
        ("6. Governing Law", 
         "This Agreement shall be governed by the laws of the State of California.")
    ]
    
    for heading, body in sections:
        pdf.set_font('helvetica', 'B', 12)
        pdf.set_text_color(30, 41, 59) # Slate 800
        pdf.cell(0, 6, heading, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        
        pdf.set_font('helvetica', '', 10)
        pdf.set_text_color(71, 85, 105) # Slate 600
        pdf.multi_cell(0, 5.5, body)
        pdf.ln(6)
        
    pdf.ln(4)
    pdf.set_font('helvetica', 'I', 10)
    pdf.set_text_color(100, 116, 139) # Slate 500
    pdf.multi_cell(0, 5.5, "By signing, the parties acknowledge that they have read, understood, and agree to be bound by the terms of this Agreement.")
    pdf.ln(12)
    
    # Signature fields
    add_signature_block(pdf)
    
    # Save files
    save_pdf_file(pdf, output_paths)

def generate_amazon_pdf(output_paths):
    pdf = ContractPDF(subtitle="Business Agreement for Amazon Advertising Services")
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # Document Title
    pdf.set_y(40)
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(15, 23, 42) # Slate 900
    pdf.cell(0, 10, "BUSINESS AGREEMENT FOR AMAZON ADVERTISING SERVICES", new_x="LMARGIN", new_y="NEXT")
    
    # Accent line under title
    pdf.set_draw_color(37, 99, 235) # Blue 600
    pdf.set_line_width(1)
    pdf.line(15, pdf.get_y() + 1, 165, pdf.get_y() + 1)
    pdf.ln(10)
    
    # Intro
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(51, 65, 85) # Slate 700
    intro_text = (
        "This Business Agreement (\"Agreement\") is made effective as of the date of signing, "
        "between the undersigned client (\"Client\"), and Sienvi Agency, a company specialized in AI Automations & "
        "Advertising, organized and existing under the laws of British Columbia, Canada with its principal office "
        "located at 9194 Tronson Road, Vernon, BC, V1H1E2 (\"Agency\")."
    )
    pdf.multi_cell(0, 5.5, intro_text)
    pdf.ln(4)
    
    recital_text = (
        "WHEREAS, the Agency agrees to provide Amazon PPC Advertising services to the Client according to the terms and conditions of this Agreement; and\n"
        "WHEREAS, the Client agrees to engage the Agency for such services and to pay the Agency for the services provided;\n"
        "NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties hereto agree as follows:"
    )
    pdf.set_font('helvetica', 'I', 9.5)
    pdf.set_text_color(100, 116, 139)
    pdf.multi_cell(0, 5, recital_text)
    pdf.ln(6)
    
    # main sections
    pdf.set_font('helvetica', 'B', 11)
    pdf.set_text_color(30, 41, 59)
    
    sections = [
        ("1. Services Provided", 
         "The Agency shall provide the Client with Amazon PPC Advertising (\"Services\") as described in Exhibit A attached hereto. The Agency agrees to use its best efforts to provide the Services in accordance with industry standards."),
        ("2. Payment", 
         "The Client agrees to pay the Agency as outlined in Exhibit B attached hereto for the provision of the Services."),
        ("3. Term and Termination", 
         "This Agreement shall commence on the date of signing and continue in effect for the Initial Term of 3 months and on a month-to-month basis thereafter, unless terminated earlier by either party with 30 days written notice."),
        ("4. Confidentiality", 
         "Both parties agree to maintain the confidentiality of each other's proprietary information as per Exhibit C. The automations and content created by the Agency will be provided to the Client by the end of the contract."),
        ("5. Governing Law", 
         "This Agreement shall be governed by the laws of British Columbia, Canada."),
        ("6. Entire Agreement", 
         "This, together with any exhibits, constitutes the entire agreement between the parties on this subject."),
        ("7. Amendment", 
         "Any amendments must be in writing and signed by both parties."),
        ("8. Counterparts", 
         "This Agreement may be executed in counterparts, each of which shall be deemed an original.")
    ]
    
    for heading, body in sections:
        pdf.set_font('helvetica', 'B', 11)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(0, 5, heading, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)
        pdf.set_font('helvetica', '', 9.5)
        pdf.set_text_color(71, 85, 105)
        pdf.multi_cell(0, 5, body)
        pdf.ln(4)
        
    pdf.ln(4)
    pdf.set_font('helvetica', 'I', 9.5)
    pdf.set_text_color(100, 116, 139)
    pdf.multi_cell(0, 5, "By signing below, the parties acknowledge that they have read, understood, and agree to be bound by the terms of this Agreement.")
    pdf.ln(10)
    
    # Signature block
    add_signature_block(pdf)
    
    # Exhibit A
    pdf.add_page()
    pdf.set_y(40)
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, "Exhibit A: Description of Services", new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(37, 99, 235)
    pdf.line(15, pdf.get_y() + 1, 95, pdf.get_y() + 1)
    pdf.ln(6)
    
    pdf.set_font('helvetica', '', 9.5)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, "Amazon PPC Advertising: The Agency will develop a comprehensive strategy tailored to the Client's business goals and targets discussed during the Strategy Discussion. These include the following:")
    pdf.ln(4)
    
    exhibits_a = [
        ("Discovery", "A full discovery over a 1-2 week period to determine logins, gaps, errors and current business infrastructure."),
        ("Prioritization", "Post discovery, the Agency will prioritize what elements of advertising additions, improvements and automations are at the forefront of the work."),
        ("Data Analysis", "Monitoring and analysis of engagement metrics to assess the company's performance and processes."),
        ("Content Optimization", "Review and suggested optimization of content based on performance data and social media trends to maximize reach and engagement using AI Optimizations and Analysis. NOTE: this does not include content creation by the Agency."),
        ("Weekly Reporting", "The Agency will provide weekly reporting via calls or Loom.com updates for the Client to understand data trends, progress and insights. The Agency will provide reporting from one Agency representative. The founder will oversee all processes by the Agency and report as required."),
        ("PPC Amazon Advertising", "The Agency will create, monitor, and modify PPC Advertising campaigns specifically in Amazon as requested by the Client.")
    ]
    
    for title, desc in exhibits_a:
        pdf.set_font('helvetica', 'B', 10)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(5, 5, "")
        pdf.cell(0, 5, f"- {title}:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('helvetica', '', 9.5)
        pdf.set_text_color(71, 85, 105)
        pdf.set_x(20)
        pdf.multi_cell(0, 5, desc)
        pdf.ln(3)
        
    # Exhibit B
    pdf.add_page()
    pdf.set_y(40)
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, "Exhibit B: Payment Terms", new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(37, 99, 235)
    pdf.line(15, pdf.get_y() + 1, 75, pdf.get_y() + 1)
    pdf.ln(6)
    
    exhibits_b = [
        ("Fee Structure", "$888 USD/month for 3 months."),
        ("Payment Schedule", "Payments to be made on a monthly basis, within 7 days of invoice receipt on the 7th of each month."),
        ("Late Payment", "Late payments may incur a late fee of 2% per month on the overdue amount."),
        ("Expenses", "The Client is responsible for any additional costs agreed upon for all payments to be made directly to third-party vendors unless otherwise agreed. This includes PPC costs on all applicable advertising platforms such as Amazon and other related e-commerce and social channels."),
        ("Adjustments and Reviews", "The fee structure and scope of services may be reviewed and adjusted periodically upon mutual agreement with 30 days notice.")
    ]
    
    for title, desc in exhibits_b:
        pdf.set_font('helvetica', 'B', 10)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(5, 5, "")
        pdf.cell(0, 5, f"- {title}:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('helvetica', '', 9.5)
        pdf.set_text_color(71, 85, 105)
        pdf.set_x(20)
        pdf.multi_cell(0, 5, desc)
        pdf.ln(3)

    # Exhibit C
    pdf.ln(4)
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, "Exhibit C: Confidentiality Agreement", new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(37, 99, 235)
    pdf.line(15, pdf.get_y() + 1, 95, pdf.get_y() + 1)
    pdf.ln(6)
    
    exhibits_c = [
        ("Confidential Information Protection", "Obligation to both parties to protect and not disclose confidential information related to business strategies, content plans, analytics, and any proprietary tools or data."),
        ("Exceptions", "Standard exceptions to confidentiality obligations apply, as detailed in the main agreement."),
        ("Duration", "The confidentiality obligations shall continue for the Confidentiality Survival Period after the termination of this Agreement."),
        ("Return or Destruction", "Upon termination, confidential information shall be returned or destroyed as agreed upon.")
    ]
    
    for title, desc in exhibits_c:
        pdf.set_font('helvetica', 'B', 10)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(5, 5, "")
        pdf.cell(0, 5, f"- {title}:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('helvetica', '', 9.5)
        pdf.set_text_color(71, 85, 105)
        pdf.set_x(20)
        pdf.multi_cell(0, 5, desc)
        pdf.ln(3)
        
    save_pdf_file(pdf, output_paths)

def add_signature_block(pdf):
    # Signature fields
    if pdf.get_y() > 220:
        pdf.add_page()
        
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_text_color(51, 65, 85)
    
    # Signature Header
    x_start = 15
    y_start = pdf.get_y()
    
    pdf.set_xy(x_start, y_start)
    pdf.cell(80, 5, "For SIENVI Agency:", new_x="RIGHT", new_y="TOP")
    pdf.set_xy(x_start + 90, y_start)
    pdf.cell(80, 5, "For Client:", new_x="LMARGIN", new_y="NEXT")
    
    pdf.ln(12)
    y_line = pdf.get_y()
    
    # Draw signature lines
    pdf.set_draw_color(148, 163, 184) # Slate 400
    pdf.line(x_start, y_line, x_start + 70, y_line)
    pdf.line(x_start + 90, y_line, x_start + 160, y_line)
    
    pdf.ln(2)
    y_labels = pdf.get_y()
    pdf.set_font('helvetica', '', 9)
    
    pdf.set_xy(x_start, y_labels)
    pdf.cell(80, 5, "Authorized Signature", new_x="RIGHT", new_y="TOP")
    pdf.set_xy(x_start + 90, y_labels)
    pdf.cell(80, 5, "Client Signature", new_x="LMARGIN", new_y="NEXT")
    
    pdf.ln(2)
    y_date = pdf.get_y()
    pdf.set_xy(x_start, y_date)
    pdf.cell(80, 5, "Date: ________________________", new_x="RIGHT", new_y="TOP")
    pdf.set_xy(x_start + 90, y_date)
    pdf.cell(80, 5, "Date: ________________________", new_x="LMARGIN", new_y="NEXT")

def save_pdf_file(pdf, output_paths):
    for path in output_paths:
        dir_name = os.path.dirname(path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name)
        pdf.output(path)
        print(f"Generated PDF: {path}")

if __name__ == "__main__":
    # General PDFs
    general_docs_path = "c:\\Users\\Iris\\OneDrive\\Work\\sienvi-agency-landing-page\\docs\\Client_Service_Agreement.pdf"
    general_artifact_path = "C:\\Users\\Iris\\.gemini\\antigravity-ide\\brain\\cce0deb9-2bbe-4d86-9023-95ea683daef7\\Client_Service_Agreement.pdf"
    generate_general_pdf([general_docs_path, general_artifact_path])
    
    # Amazon PDFs
    amazon_docs_path = "c:\\Users\\Iris\\OneDrive\\Work\\sienvi-agency-landing-page\\docs\\Business_Agreement_Amazon_Advertising_Services.pdf"
    amazon_artifact_path = "C:\\Users\\Iris\\.gemini\\antigravity-ide\\brain\\cce0deb9-2bbe-4d86-9023-95ea683daef7\\Business_Agreement_Amazon_Advertising_Services.pdf"
    generate_amazon_pdf([amazon_docs_path, amazon_artifact_path])
