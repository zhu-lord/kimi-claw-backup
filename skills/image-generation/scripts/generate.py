#!/usr/bin/env python3
"""
AI Image Generation Script
Supports: OpenAI DALL-E, Stability AI, Fal.ai, Pollinations
"""

import argparse
import json
import os
import sys
import base64
from pathlib import Path

import requests
from PIL import Image
from io import BytesIO


def load_config():
    """Load configuration from environment or config file"""
    config_path = Path.home() / ".openclaw" / "image-gen-config.json"
    
    config = {}
    if config_path.exists():
        with open(config_path) as f:
            config = json.load(f)
    
    # Override with environment variables
    if os.getenv("OPENAI_API_KEY"):
        config["openai_api_key"] = os.getenv("OPENAI_API_KEY")
    if os.getenv("OPENAI_BASE_URL"):
        config["openai_base_url"] = os.getenv("OPENAI_BASE_URL")
    if os.getenv("STABILITY_API_KEY"):
        config["stability_api_key"] = os.getenv("STABILITY_API_KEY")
    if os.getenv("FAL_KEY"):
        config["fal_key"] = os.getenv("FAL_KEY")
    
    return config


def generate_openai(prompt, api_key, size="1024x1024", model="dall-e-3", base_url=None):
    """Generate image using OpenAI DALL-E or compatible API"""
    try:
        from openai import OpenAI
    except ImportError:
        print("Error: openai package not installed. Run: pip install openai")
        sys.exit(1)
    
    client_args = {"api_key": api_key}
    if base_url:
        client_args["base_url"] = base_url
    
    client = OpenAI(**client_args)
    
    response = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        quality="standard",
        n=1,
    )
    
    image_url = response.data[0].url
    
    # Download image
    img_response = requests.get(image_url, timeout=60)
    img_response.raise_for_status()
    
    return Image.open(BytesIO(img_response.content))


def generate_stability(prompt, api_key, size="1024x1024"):
    """Generate image using Stability AI"""
    width, height = map(int, size.split("x"))
    
    response = requests.post(
        "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        headers={
            "authorization": f"Bearer {api_key}",
            "accept": "image/*"
        },
        files={"none": ("", "")},
        data={
            "prompt": prompt,
            "output_format": "png",
            "width": width,
            "height": height,
        },
        timeout=120
    )
    
    if response.status_code == 200:
        return Image.open(BytesIO(response.content))
    else:
        raise Exception(f"Stability API error: {response.status_code} - {response.text}")


def generate_fal(prompt, api_key, model="flux-pro", size="1024x1024"):
    """Generate image using Fal.ai"""
    width, height = map(int, size.split("x"))
    
    headers = {
        "Authorization": f"Key {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "prompt": prompt,
        "image_size": {"width": width, "height": height}
    }
    
    response = requests.post(
        f"https://fal.run/fal-ai/{model}",
        headers=headers,
        json=data,
        timeout=120
    )
    
    response.raise_for_status()
    result = response.json()
    
    # Download image from URL
    image_url = result.get("images", [{}])[0].get("url")
    if not image_url:
        raise Exception("No image URL in response")
    
    img_response = requests.get(image_url, timeout=60)
    img_response.raise_for_status()
    
    return Image.open(BytesIO(img_response.content))


def generate_pollinations(prompt, size="1024x1024", seed=None):
    """Generate image using Pollinations (Free)"""
    width, height = map(int, size.split("x"))
    
    # Encode prompt for URL
    encoded_prompt = requests.utils.quote(prompt)
    
    # Build URL with parameters
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}"
    params = {
        "width": width,
        "height": height,
        "nologo": "true",
        "enhance": "true"
    }
    if seed:
        params["seed"] = seed
    
    # Add headers to avoid 530 error
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0"
    }
    
    response = requests.get(url, params=params, headers=headers, timeout=120)
    response.raise_for_status()
    
    return Image.open(BytesIO(response.content))


def main():
    parser = argparse.ArgumentParser(description="Generate AI images")
    parser.add_argument("--provider", default="openai", 
                       choices=["openai", "stability", "fal", "pollinations"],
                       help="Image generation provider")
    parser.add_argument("--prompt", required=True, help="Image prompt")
    parser.add_argument("--output", default="generated.png", help="Output file path")
    parser.add_argument("--size", default="1024x1024", help="Image size (e.g., 1024x1024)")
    parser.add_argument("--model", help="Specific model name")
    parser.add_argument("--reference-images", nargs="+", help="Reference images for style consistency")
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config()
    
    # Generate image based on provider
    try:
        if args.provider == "openai":
            api_key = config.get("openai_api_key")
            base_url = config.get("openai_base_url")
            if not api_key:
                print("Error: OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
                sys.exit(1)
            
            model = args.model or "dall-e-3"
            image = generate_openai(args.prompt, api_key, args.size, model, base_url)
        
        elif args.provider == "stability":
            api_key = config.get("stability_api_key")
            if not api_key:
                print("Error: Stability API key not found. Set STABILITY_API_KEY environment variable.")
                sys.exit(1)
            
            image = generate_stability(args.prompt, api_key, args.size)
        
        elif args.provider == "fal":
            api_key = config.get("fal_key")
            if not api_key:
                print("Error: Fal API key not found. Set FAL_KEY environment variable.")
                sys.exit(1)
            
            model = args.model or "flux-pro"
            image = generate_fal(args.prompt, api_key, model, args.size)
        
        elif args.provider == "pollinations":
            print("Using Pollinations (free service)...")
            image = generate_pollinations(args.prompt, args.size)
        
        # Save image
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert to RGB if necessary (for PNG with transparency)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        image.save(output_path, quality=95)
        print(f"✅ Image saved to: {output_path.absolute()}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
