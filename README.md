This is my attempt at adepting my waldo-lib template matching library **from a template-based approach to a feature-based approach**

The original waldo-lib overlays the template at every position and returns the overlay point of highest similarity (Template-based)
A feature-based aproach would be to extract feature from both template and image, describe them based on surrounding pixels and then compare them to find the best template- to image-feature matches, so that the feature pattern matches

I got as far as feature extraction and description.