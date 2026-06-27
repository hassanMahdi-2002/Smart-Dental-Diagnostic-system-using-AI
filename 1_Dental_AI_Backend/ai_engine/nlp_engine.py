# import warnings
# warnings.filterwarnings("ignore", category=FutureWarning)
import google.generativeai as genai
import os
import json
import re

class DentalNLP:
    def __init__(self, api_key=None):
        self.api_key = api_key
    
        if self.api_key:
            genai.configure(api_key=self.api_key)
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT","threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH","threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT","threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT","threshold": "BLOCK_NONE"},
            ]
            generation_config = {
                "temperature": 0.2, # تقليل العشوائية لضمان دقة طبية أعلى
                "response_mime_type": "application/json",
            }
            self.model = genai.GenerativeModel(
                model_name="gemini-2.5-flash", 
                safety_settings=safety_settings,
                generation_config=generation_config,
                system_instruction="""
                You are an expert dentist and a smart assistant.
                Your role is to analyze diagnostic data, write accurate medical reports, and answer patients'
                questions.
                1. Speak in polite and reassuring Egyptian Arabic (or simple Modern Standard Arabic).
                2. If chronic conditions (diabetes, hypertension, bleeding disorders) are present,
                they should be considered in relation to the current dental condition.
                3. Always recommend a visit to the clinic for a final diagnosis.
                """
                # """
                # أنت طبيب أسنان خبير ومساعد ذكي.
                # دورك هو تحليل بيانات التشخيص وكتابة تقارير طبية دقيقة، والرد على أسئلة المرضى.
                # 1. تحدث باللهجة المصرية المهذبة والمطمئنة (أو العربية الفصحى البسيطة).
                # 2. عند وجود أمراض مزمنة (سكري، ضغط، سيولة)، يجب ربطها بالحالة الحالية للأسنان.
                # 3. دائماً انصح بزيارة العيادة للتشخيص النهائي.
                # """
            )

    def generate_ai_report(self, diseases_found, primary_diagnosis, medical_history="None"):
        if not self.api_key:
            return {
                "Advice": "الخدمة غير مفعلة.",
                "Action_Plan": "لا يوجد",
                "Urgency": "Checkup"
            }

        diseases_str = ", ".join([d['disease'] for d in diseases_found])
        prompt = f"""
        You are a smart dental assistant.
        The data entered is the result of an analysis of a "visual photograph" of the patient's teeth.
        
        Results detected: {diseases_str}
        Primary diagnosis: {primary_diagnosis}
        
        Patient health information (very important):
        Medical history: "{medical_history}"
                    
        Report Instructions:
        1. If the patient's medical history includes chronic conditions (such as diabetes, hypertension, heart disease, or blood clotting disorders), their impact on the teeth should be mentioned in the "Details" and "Action Plan" sections.
            - Example: If "diabetes": Be aware of slow gum healing and the need to control blood sugar levels before extraction.
            - Example: If "hypertension": Advise the dentist to avoid certain types of anesthesia.
        2. If the patient's medical history is "None" or "not present," treat them as a healthy individual.
        3. Do not mention the roots or nerves, as these are superficial.
        
        Required: A report in JSON format:
        - Summary: A summary of the patient's condition (including any chronic illnesses and a brief description of their impact).
        - Details: A detailed explanation of the effects of chronic illnesses on the mouth and gums.
        - Action Plan: Treatment recommendations and specific advice related to the patient's health condition (e.g., "Check blood sugar before the visit").
        - Urgency: (Normal, High, Critical).        
        """    
                
        # """
        # أنت مساعد طبيب أسنان ذكي.
        # البيانات المدخلة هي نتيجة تحليل "صورة فوتوغرافية ظاهرية" لأسنان المريض.
    
        # النتائج المكتشفة: {diseases_str}
        # التشخيص الأساسي: {primary_diagnosis}
        
        # 🛑 معلومات المريض الصحية (هام جداً):
        # التاريخ المرضي: "{medical_history}"
        
        # تعليمات التقرير:
        # 1. إذا كان التاريخ المرضي يحتوي على أمراض مزمنة (مثل السكري، الضغط، القلب، سيولة الدم)، يجب ذكر تأثيرها على حالة الأسنان في قسم "Details" و "Action Plan".
        #    - مثال: لو "سكري": حذر من بطء التئام اللثة وضرورة ضبط السكر قبل الخلع.
        #    - مثال: لو "ضغط": انصح بإخبار الطبيب لتجنب أنواع بنج معينة.
        # 2. إذا كان التاريخ المرضي "None" أو "لا يوجد"، تعامل كشخص سليم.
        # 3. لا تتحدث عن الجذور أو العصب لأنها صورة ظاهرية.
        
        # المطلوب: تقرير بصيغة JSON:
        # - summary: ملخص الحالة (مع ذكر المرض المزمن إن وجد وتأثيره باختصار).
        # - details: شرح التفاصيل وتأثير الأمراض المزمنة على الفم واللثة.
        # - action_plan: نصائح علاجية + نصائح خاصة لحالته الصحية (مثل: "قس السكر قبل الزيارة").
        # - urgency: (Normal, High, Critical).
        # """
        try:
            response = self.model.generate_content(prompt)
            report_data = json.loads(response.text)
            text_response = response.text
            
            match = re.search(r'\{.*\}', text_response, re.DOTALL)
            
            if match:
                clean_json = match.group(0)
                report_data = json.loads(clean_json)
            else:
                raise ValueError("Gemini did not return a valid JSON format")
            
            return {
                "Advice": report_data.get('Summary', report_data.get('summary', 'يرجى مراجعة الطبيب')),
                "Details": report_data.get('Details', report_data.get('details', '')),
                "Action_Plan": report_data.get('Action Plan', report_data.get('action_plan', 'لا توجد خطة عمل محددة')),
                "Urgency": report_data.get('Urgency', report_data.get('urgency', 'Normal'))
            }
            
        except Exception as e:
            print(f"NLP Engine Error: {str(e)}") 
            return {
                "Advice": f"تم اكتشاف {primary_diagnosis}. يرجى زيارة الطبيب.",
                "Details": "حدث خطأ أثناء معالجة التقرير المفصل.",
                "Action_Plan": "الرجاء مراجعة الطبيب للفحص السريري.",
                "Urgency": "Normal"
            }
# -----------------------------------------------------------
        # try:
        #     response = self.model.generate_content(prompt)
        #     text_response = response.text.replace('```json', '').replace('```', '').strip()
            
        #     if text_response.lower().startswith('json'):
        #         text_response = text_response[4:].strip()

        #     report_data = json.loads(text_response)
            
        #     return {
        #         "Advice": report_data.get('Summary', report_data.get('summary', 'يرجى مراجعة الطبيب')),
        #         "Action_Plan": report_data.get('Action Plan', report_data.get('action_plan', 'لا توجد خطة عمل محددة')),
        #         "Urgency": report_data.get('Urgency', report_data.get('urgency', 'Normal'))
        #     }
            
        #     # return {
        #     #     "Advice": report_data.get('summary', 'يرجى مراجعة الطبيب'),
        #     #     "Details": report_data.get('details', ''),
        #     #     "Action_Plan": report_data.get('action_plan', ''),
        #     #     "Urgency": report_data.get('urgency', 'Normal')
        #     # }
            
        # except Exception as e:
        #     print(f"NLP Engine Error: {str(e)}")
        #     return {
        #         "Advice": f"تم اكتشاف {primary_diagnosis}. يرجى زيارة الطبيب.",
        #         "Details": "لم نتمكن من استخراج تفاصيل التقرير بسبب ضغط على خوادم الذكاء الاصطناعي.",
        #         "Action_Plan": "الرجاء مراجعة العيادة لوضع خطة العلاج المناسبة.",
        #         "Urgency": "Normal"
        #     }

    def chat_with_context(self, user_question, diagnosis_context, chat_history=[]):
        """
        الرد على أسئلة الشات مع مراعاة التشخيص السابق
        """
        if not self.api_key:
            return "عذراً، الخدمة غير متاحة حالياً."

        context_str = f"تشخيص المريض الحالي (صورة ظاهرية): {json.dumps(diagnosis_context, ensure_ascii=False)}"
        
        chat_session = self.model.start_chat(history=[
            {"role": "user", "parts": [context_str]} 
        ])
        
        response = chat_session.send_message(user_question)
        return response.text
    
