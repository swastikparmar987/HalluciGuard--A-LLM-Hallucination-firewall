import os
import logging
from ibmcloudant.cloudant_v1 import CloudantV1, Document
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from datetime import datetime

logger = logging.getLogger(__name__)

class CloudantClient:
    def __init__(self):
        self.url = os.getenv("CLOUDANT_URL")
        self.apikey = os.getenv("CLOUDANT_APIKEY")
        self.db_name = os.getenv("CLOUDANT_DB_NAME", "halluciguard_logs")
        self.client = None
        
        if self.url and self.apikey:
            try:
                authenticator = IAMAuthenticator(self.apikey)
                self.client = CloudantV1(authenticator=authenticator)
                self.client.set_service_url(self.url)
                logger.info(f"[CLOUDANT] Connected to {self.url}")
                
                # Ensure DB exists
                self._ensure_db_exists()
            except Exception as e:
                logger.error(f"[CLOUDANT INIT ERROR] {e}")
                self.client = None
        else:
            logger.info("[CLOUDANT] Missing credentials. Skipping Cloudant integration.")

    def _ensure_db_exists(self):
        if not self.client:
            return
        try:
            self.client.put_database(db=self.db_name).get_result()
            logger.info(f"[CLOUDANT] Database '{self.db_name}' verified/created.")
        except Exception as e:
            if "already exists" in str(e).lower():
                pass
            else:
                logger.error(f"[CLOUDANT DB ERROR] {e}")

    def log_query(self, log_data: dict):
        if not self.client:
            return None
        
        try:
            # Ensure timestamp is ISO format
            if "timestamp" not in log_data:
                log_data["timestamp"] = datetime.utcnow().isoformat()
            
            # Create a document
            doc = Document(**log_data)
            
            response = self.client.post_document(
                db=self.db_name,
                document=doc
            ).get_result()
            
            logger.info(f"[CLOUDANT] Logged document ID: {response.get('id')}")
            return response.get('id')
        except Exception as e:
            logger.error(f"[CLOUDANT LOG ERROR] {e}")
            return None

    def log_user(self, user_data: dict):
        """Save user profile to Cloudant."""
        if not self.client:
            return None
        try:
            user_db = "halluciguard_users"
            # Ensure user DB exists
            try:
                self.client.put_database(db=user_db).get_result()
            except:
                pass
            
            doc = Document(**user_data)
            response = self.client.post_document(
                db=user_db,
                document=doc
            ).get_result()
            return response.get('id')
        except Exception as e:
            logger.error(f"[CLOUDANT USER ERROR] {e}")
            return None

    def get_user(self, email: str):
        """Retrieve user profile by email from Cloudant."""
        if not self.client:
            return None
        try:
            user_db = "halluciguard_users"
            # Use Cloudant Query (find)
            selector = {"email": {"$eq": email}}
            result = self.client.post_find(
                db=user_db,
                selector=selector
            ).get_result()
            docs = result.get('docs', [])
            return docs[0] if docs else None
        except Exception as e:
            logger.error(f"[CLOUDANT AUTH ERROR] {e}")
            return None

# Singleton instance
cloudant_service = CloudantClient()
