import cv2
import easyocr
import re
import numpy as np
import os
import ssl
import fitz  # PyMuPDF for PDF handling
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS

# Handle SSL certificate verification
ssl._create_default_https_context = ssl._create_unverified_context

# API Configuration
app = Flask(__name__)
CORS(app)

# Initialize EasyOCR reader once to improve performance
reader = easyocr.Reader(['en'])

class CertificateExtractor:
    """Handles extraction and classification of text from certificate images and PDFs"""
    
    def __init__(self):
        # Known issuers for better classification
        self.issuers = ["NPTEL", "Coursera", "Udemy", "IIT", "AICTE", "IEEE", 
                        "Springer", "Elsevier", "Google", "Microsoft"]
        
        # Certificate type keywords mapping
        self.type_keywords = {
            "MOOC": ["NPTEL", "Coursera", "Udemy", "edX", "Online Course"],
            "Internship": ["Internship", "Work Experience", "Practical Training"],
            "Workshop": ["Workshop", "Training", "Seminar"],
            "Paper Presentation": ["Paper Presentation", "Conference", "Publication"],
            "Tech Fest": ["Tech Fest", "Hackathon", "Competition", "Challenge"],
            "Sports Event": ["Sports", "Athletics", "Tournament", "Championship"]
        }
    
    def extract_text_from_image(self, image):
        """Extract text from the provided image using EasyOCR"""
        # Convert to RGB (EasyOCR requires RGB images)
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Extract text using EasyOCR
        results = reader.readtext(img_rgb, detail=0)
        return " ".join(results)
    
    def extract_text_from_pdf(self, pdf_data):
        """Extract text and images from PDF"""
        text_content = []
        
        # Create a temporary file to save the PDF
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
            temp_pdf.write(pdf_data)
            temp_pdf_path = temp_pdf.name
        
        try:
            # Open the PDF
            pdf_document = fitz.open(temp_pdf_path)
            
            # Process each page
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                
                # Extract text directly from PDF
                page_text = page.get_text()
                if page_text.strip():
                    text_content.append(page_text)
                
                # Extract images if text extraction yields limited results
                if not page_text.strip() or len(page_text.strip()) < 50:
                    # Get images
                    image_list = page.get_images(full=True)
                    
                    # Process each image
                    for img_index, img_info in enumerate(image_list):
                        xref = img_info[0]
                        base_image = pdf_document.extract_image(xref)
                        image_bytes = base_image["image"]
                        
                        # Convert image bytes to numpy array
                        image_np = np.frombuffer(image_bytes, np.uint8)
                        image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
                        
                        if image is not None:
                            # Extract text from image using EasyOCR
                            image_text = self.extract_text_from_image(image)
                            if image_text.strip():
                                text_content.append(image_text)
            
            pdf_document.close()
        except Exception as e:
            print(f"PDF processing error: {str(e)}")
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_pdf_path):
                os.unlink(temp_pdf_path)
        
        return " ".join(text_content)
    
    def extract_text(self, file_data, file_type):
        """Extract text based on file type"""
        if file_type == 'pdf':
            return self.extract_text_from_pdf(file_data)
        else:
            # Handle as image
            image_np = np.frombuffer(file_data, np.uint8)
            img = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Unable to decode image")
            return self.extract_text_from_image(img)
    
    def classify_text(self, text):
        """Classify extracted text into structured certificate information with improved patterns"""
        classified_data = {
            "participant_name": "Not Found",
            "certificate_name": "Not Found",
            "certificate_type": "Not Found",
            "issuer": "Not Found",
            "date_of_issue": "Not Found",
            "raw_text": text  # Include raw text for debugging
        }
        
        # Extract Certificate Name first (Based on common certificate title words)
        cert_name_patterns = [
            r"(CERTIFICATE OF [A-Za-z\s]+)",
            r"([A-Za-z\s]+ CERTIFICATE)",
            r"(Certificate of [A-Za-z\s]+)",
            r"([A-Za-z\s]+ Certificate)"
        ]
        
        for pattern in cert_name_patterns:
            cert_match = re.search(pattern, text)
            if cert_match:
                classified_data["certificate_name"] = cert_match.group(1).strip()
                break
        
        # Extract Participant Name with improved patterns
        name_patterns = [
            r"awarded to\s+([A-Z][A-Za-z\s.]+?)(?:\s+FOR|\s+in|\s+on|\s+at|\s+[0-9]|$)",
            r"presented to\s+([A-Z][A-Za-z\s.]+?)(?:\s+FOR|\s+in|\s+on|\s+at|\s+[0-9]|$)",
            r"certifies that\s+([A-Z][A-Za-z\s.]+?)(?:\s+FOR|\s+in|\s+on|\s+at|\s+[0-9]|$)",
            r"awarded to\s+([A-Z][A-Za-z\s.]+)",
            r"presented to\s+([A-Z][A-Za-z\s.]+)",
            r"certifies that\s+([A-Z][A-Za-z\s.]+)",
            r"this certificate is proudly awarded to\s+([A-Z][A-Za-z\s.]+?)(?:\s+FOR|\s+in|\s+on|\s+at|\s+[0-9]|$)",
            r"(Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][A-Za-z\s.]+)"
        ]
        
        for pattern in name_patterns:
            name_match = re.search(pattern, text, re.IGNORECASE)
            if name_match:
                # Check if the match has a group 2 (for patterns with titles)
                if len(name_match.groups()) > 1 and name_match.group(2):
                    classified_data["participant_name"] = name_match.group(2).strip()
                else:
                    classified_data["participant_name"] = name_match.group(1).strip()
                break
        
        # Extract Event/Activity Information
        event_patterns = [
            r"FOR PARTICIPATING IN THE [\"']?([^\"']+?)[\"']?",
            r"FOR COMPLETING [\"']?([^\"']+?)[\"']?",
            r"FOR ATTENDING [\"']?([^\"']+?)[\"']?"
        ]
        
        for pattern in event_patterns:
            event_match = re.search(pattern, text, re.IGNORECASE)
            if event_match:
                event_name = event_match.group(1).strip()
                if event_name and classified_data["certificate_name"] == "Not Found":
                    classified_data["certificate_name"] = f"Certificate for {event_name}"
                break
        
        # Extract Date of Issue (Common date formats)
        date_patterns = [
            r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",  # DD-MM-YYYY or MM-DD-YYYY
            r"(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b)",  # Month DD, YYYY
            r"(issued\s+on\s+[\w\s,]+\d{4})",  # "issued on" followed by date
            r"DATE OF ISSUE[:\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})",  # DATE OF ISSUE: DD/MM/YYYY
            r"CONDUCTED\s+(?:ONLINE\s+)?ON\s+([0-9]{1,2}\s+[A-Z]+\s+[0-9]{4})"  # CONDUCTED ON 19 MAY 2023
        ]
        
        for pattern in date_patterns:
            date_match = re.search(pattern, text, re.IGNORECASE)
            if date_match:
                classified_data["date_of_issue"] = date_match.group(1).strip()
                break
        
        # Extract certificate type with more context
        if "PARTICIPATION" in text.upper():
            classified_data["certificate_type"] = "Participation"
        elif "COMPLETION" in text.upper():
            classified_data["certificate_type"] = "Completion"
        elif "ACHIEVEMENT" in text.upper():
            classified_data["certificate_type"] = "Achievement"
        elif "APPRECIATION" in text.upper():
            classified_data["certificate_type"] = "Appreciation"
        else:
            # Fallback to keyword matching
            for cert_type, keywords in self.type_keywords.items():
                if any(keyword.lower() in text.lower() for keyword in keywords):
                    classified_data["certificate_type"] = cert_type
                    break
        
        # Extract Issuer with improved detection
        # First try to find common issuer patterns
        issuer_patterns = [
            r"issued by\s+([A-Za-z\s&.]+)",
            r"CONDUCTED\s+(?:ONLINE\s+)?(?:ON\s+[0-9]{1,2}\s+[A-Z]+\s+[0-9]{4}\s+)?BY\s+([A-Z][A-Za-z\s&.]+)",
            r"COLLEGE\s+([A-Z][A-Za-z\s&.]+)",
            r"UNIVERSITY\s+([A-Z][A-Za-z\s&.]+)"
        ]
        
        for pattern in issuer_patterns:
            issuer_match = re.search(pattern, text, re.IGNORECASE)
            if issuer_match:
                classified_data["issuer"] = issuer_match.group(1).strip()
                break
        
        # If no issuer found with patterns, try known issuers
        if classified_data["issuer"] == "Not Found":
            for issuer in self.issuers:
                if issuer.lower() in text.lower():
                    classified_data["issuer"] = issuer
                    break
        
        # Check for FOSS and other organizations in the text
        if "FOSS" in text and classified_data["issuer"] == "Not Found":
            if "VJCET" in text:
                classified_data["issuer"] = "FOSS VJCET"
            else:
                classified_data["issuer"] = "FOSS"
        
        return classified_data

# Create an instance of the extractor
certificate_extractor = CertificateExtractor()

# API Routes
@app.route('/api/v1/extract', methods=['POST'])
def extract_certificate_text():
    """
    Extract and classify text from certificate images or PDFs
    ---
    Returns structured information about the certificate
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No file uploaded',
                'code': 400
            }), 400
        
        file = request.files['file']
        if not file.filename:
            return jsonify({
                'status': 'error',
                'message': 'Empty filename',
                'code': 400
            }), 400
        
        # Determine file type
        file_type = 'pdf' if file.filename.lower().endswith('.pdf') else 'image'
        
        # Read file data
        file_data = file.read()
        
        if not file_data:
            return jsonify({
                'status': 'error',
                'message': 'Empty file content',
                'code': 400
            }), 400
        
        # Extract text from file
        extracted_text = certificate_extractor.extract_text(file_data, file_type)
        
        if not extracted_text.strip():
            return jsonify({
                'status': 'error',
                'message': 'No text could be extracted from the file',
                'code': 400
            }), 400
        
        # Classify extracted data
        classified_info = certificate_extractor.classify_text(extracted_text)
        
        return jsonify({
            'status': 'success',
            'data': classified_info,
            'file_type': file_type,
            'code': 200
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'code': 500
        }), 500

# Health check endpoint
@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'Certificate Extraction API is running',
        'code': 200
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)