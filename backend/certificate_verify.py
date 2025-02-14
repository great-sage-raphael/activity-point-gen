import sys
import os
import cv2
import pytesseract

# Ensure Tesseract is correctly set (change path if needed)
pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"  # Update this if required

def preprocess_image(image_path):
    """Load and preprocess image for OCR"""
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' not found.")
        sys.exit(1)

    # Load image
    image = cv2.imread(image_path)

    if image is None:
        print("Error: Unable to load image. Check file format and path.")
        sys.exit(1)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply thresholding
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)

    # Apply morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    processed_image = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    return processed_image

def extract_text_from_image(image):
    """Extract text from image using Tesseract"""
    custom_config = r'--oem 3 --psm 6'
    text = pytesseract.image_to_string(image, config=custom_config)

    return text.strip()

def recognize_certificate(image_path):
    """Main function to process image and extract text"""
    processed_image = preprocess_image(image_path)
    text = extract_text_from_image(processed_image)

    return text

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python certificate_verify.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    recognized_text = recognize_certificate(image_path)

    if recognized_text:
        print(recognized_text)
    else:
        print("Error: No text detected.")
        sys.exit(1)