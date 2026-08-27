import streamlit as st
import datetime
import pandas as pd
import uuid

# -------------------------------------------------------------------
# APP CONFIG & SESSION STATE
# -------------------------------------------------------------------
st.set_page_config(page_title="Smart KrishiDirect SIH26033", layout="wide")

if "language" not in st.session_state:
    st.session_state.language = "English"

if "banned_devices" not in st.session_state:
    st.session_state.banned_devices = []

CURRENT_DEVICE_ID = "DEV-88902-X9"

# Shared Chat Database supporting images/files
if "chat_messages" not in st.session_state:
    st.session_state.chat_messages = [
        {
            "sender": "AgriCorp (Buyer)", 
            "role": "Buyer", 
            "text": "Hello Ramesh ji, what is the exact variety of tomatoes?", 
            "time": "10:15 AM",
            "file": None,
            "file_type": None
        },
        {
            "sender": "Ramesh Kumar (Farmer)", 
            "role": "Farmer", 
            "text": "Namaste! These are high-quality Hybrid Grade-A tomatoes.", 
            "time": "10:18 AM",
            "file": None,
            "file_type": None
        }
    ]

# Shared Active Orders & Tracking Database
if "orders" not in st.session_state:
    st.session_state.orders = [
        {
            "order_id": "ORD-9901",
            "listing_id": "LST-101",
            "farmer_name": "Ramesh Kumar",
            "buyer_name": "AgriCorp Procurements",
            "crop": "Tomatoes",
            "qty": 20,
            "amount": 5600,
            "status": "In Transit",
            "origin": "Nashik, Maharashtra",
            "destination": "Mumbai Central Mandi",
            "current_location": "Bhiwandi Logistics Hub (24 km away)",
            "eta": "2 Hours (Today, 4:30 PM)",
            "driver_name": "Vikram Singh (+91 98765-43210)"
        }
    ]

# Mock Farmer Database
if "farmers" not in st.session_state:
    st.session_state.farmers = {
        "FARM001": {
            "name": "Ramesh Kumar",
            "aadhaar": "XXXX-XXXX-1234",
            "device_id": CURRENT_DEVICE_ID,
            "location": "Nashik, Maharashtra",
            "honor_score": 100,
            "total_orders": 24,
            "positive_reviews": 23,
            "kyc_verified": True,
            "listings": [
                {
                    "id": "LST-101",
                    "crop": "Tomatoes",
                    "qty": 20,
                    "rate": 28.0,
                    "freshness": 5,
                    "status": "Available"
                }
            ]
        }
    }

if "buyers" not in st.session_state:
    st.session_state.buyers = {
        "BUY001": {
            "name": "AgriCorp Procurements (Buyer)",
            "company": "AgriCorp India Ltd.",
            "device_id": "DEV-BUYER-01"
        }
    }

if "cold_storages" not in st.session_state:
    st.session_state.cold_storages = [
        {"name": "Kisan Shitgrah (Krishi Hub)", "distance_km": 4.2, "available_quintals": 450, "rate_per_day": 15},
        {"name": "AgriFrost Cold Logistics", "distance_km": 11.5, "available_quintals": 1200, "rate_per_day": 12},
    ]

if "buyer_ads" not in st.session_state:
    st.session_state.buyer_ads = [
        {"id": "AD-101", "crop": "Tomatoes", "required_qty_qtl": 50, "offered_rate": 28, "buyer_name": "AgriCorp Procurements"}
    ]

if "cancellations_pending" not in st.session_state:
    st.session_state.cancellations_pending = []

# Localization Dictionary
LANG = {
    "English": {
        "farmer_dash": "Farmer Dashboard",
        "buyer_dash": "Buyer Dashboard",
        "chat_tab": "💬 Live Negotiation Chat",
        "track_tab": "🚚 Live Order Tracker",
        "cold_tab": "🧊 Cold Storage Locator",
        "ads_tab": "📢 Reverse Buyer Ads",
        "honor_label": "Your Honor Score:",
        "kyc_status": "Aadhaar e-KYC: Verified",
        "banned_msg": "⛔ ACCOUNT SUSPENDED: Low Honor Score (<50).",
        "bulk_disabled_msg": "⚠️ WARNING: Honor Score below 70. Bulk selling options disabled.",
        "pub_listing": "📦 Publish Harvest Listing",
        "act_listing": "📋 Active Farmer Listings",
        "select_crop": "Select Crop",
        "harvest_date": "Harvest Date",
        "qty_qtl": "Quantity (Quintals)",
        "set_price": "Set Price (₹/kg)",
        "btn_publish": "Publish Listing",
        "send_btn": "Send Message",
        "type_msg": "Type your message here...",
        "attach_label": "Attach Photo or Document"
    },
    "Hindi": {
        "farmer_dash": "किसान डैशबोर्ड",
        "buyer_dash": "खरीदार डैशबोर्ड",
        "chat_tab": "💬 लाइव चैट",
        "track_tab": "🚚 लाइव ऑर्डर ट्रैकिंग",
        "cold_tab": "🧊 कोल्ड स्टोरेज खोजें",
        "ads_tab": "📢 खरीदार मांग विज्ञापन",
        "honor_label": "आपका सम्मान स्कोर:",
        "kyc_status": "आधार e-KYC: सत्यापित",
        "banned_msg": "⛔ खाता निलंबित: सम्मान स्कोर (<50) कम है।",
        "bulk_disabled_msg": "⚠️ चेतावनी: सम्मान स्कोर 70 से कम है। थोक बिक्री विकल्प बंद हैं।",
        "pub_listing": "📦 फसल बिक्री के लिए पोस्ट करें",
        "act_listing": "📋 आपकी सक्रिय फसल सूची",
        "select_crop": "फसल चुनें",
        "harvest_date": "कटाई की तिथि",
        "qty_qtl": "मात्रा (क्विंटल)",
        "set_price": "मूल्य तय करें (₹/किग्रा)",
        "btn_publish": "सूची प्रकाशित करें",
        "send_btn": "संदेश भेजें",
        "type_msg": "अपना संदेश यहाँ लिखें...",
        "attach_label": "फोटो या दस्तावेज संलग्न करें"
    }
}

# -------------------------------------------------------------------
# SIDEBAR LOGIN & LANGUAGE CONTROL
# -------------------------------------------------------------------
with st.sidebar:
    st.header("🔑 Account Switcher")
    user_role = st.radio(
        "Log in as:",
        ["👨‍🌾 Farmer (Ramesh Kumar)", "🛒 Buyer (AgriCorp)", "🕵️ Field Representative Audit"],
        index=0
    )
    st.divider()
    selected_lang = st.radio("Language / भाषा", ["English", "Hindi"], index=0 if st.session_state.language == "English" else 1, horizontal=True)
    st.session_state.language = selected_lang

l = LANG[st.session_state.language]

# -------------------------------------------------------------------
# HELPER: CHAT MODULE (Left vs Right Alignment + Media Attachments)
# -------------------------------------------------------------------
def render_chat_module(current_sender_name, current_role):
    st.subheader(f"💬 Live Negotiation & File Sharing ({current_sender_name})")
    st.caption("Right = Messages Sent by You | Left = Messages Received")

    chat_box = st.container(height=380)
    with chat_box:
        for msg in st.session_state.chat_messages:
            is_me = (msg["role"] == current_role)
            
            # Message Container Layout (Right for current user, Left for recipient)
            if is_me:
                c_blank, c_msg = st.columns([1, 4])
                with c_msg:
                    st.markdown(
                        f"""
                        <div style="background-color: #2e5b88; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; color: white;">
                            <b>{msg['sender']}</b> <span style="font-size: 0.8em; opacity: 0.8;">({msg['time']})</span><br/>
                            {msg['text']}
                        </div>
                        """,
                        unsafe_allow_html=True
                    )
                    if msg.get("file"):
                        if msg.get("file_type") and "image" in msg["file_type"]:
                            st.image(msg["file"], width=220)
                        else:
                            st.download_button("📎 Download Attached Document", data=msg["file"], file_name="attached_document.pdf")
            else:
                c_msg, c_blank = st.columns([4, 1])
                with c_msg:
                    st.markdown(
                        f"""
                        <div style="background-color: #3f444e; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; color: white;">
                            <b>{msg['sender']}</b> <span style="font-size: 0.8em; opacity: 0.8;">({msg['time']})</span><br/>
                            {msg['text']}
                        </div>
                        """,
                        unsafe_allow_html=True
                    )
                    if msg.get("file"):
                        if msg.get("file_type") and "image" in msg["file_type"]:
                            st.image(msg["file"], width=220)
                        else:
                            st.download_button("📎 Download Attached Document", data=msg["file"], file_name="attached_document.pdf")

    # Chat Input Box & Attachment Uploader
    with st.form(key=f"chat_form_{current_role}", clear_on_submit=True):
        col_in1, col_in2, col_btn = st.columns([3, 2, 1])
        with col_in1:
            chat_text = st.text_input(l["type_msg"], key=f"text_in_{current_role}")
        with col_in2:
            uploaded_file = st.file_uploader(l["attach_label"], type=["jpg", "jpeg", "png", "pdf"], key=f"file_in_{current_role}")
        with col_btn:
            st.write("")
            st.write("")
            submit_chat = st.form_submit_button(l["send_btn"], use_container_width=True)

        if submit_chat:
            if chat_text.strip() != "" or uploaded_file is not None:
                file_bytes = None
                file_type = None
                if uploaded_file is not None:
                    file_bytes = uploaded_file.getvalue()
                    file_type = uploaded_file.type

                now_str = datetime.datetime.now().strftime("%I:%M %p")
                st.session_state.chat_messages.append({
                    "sender": current_sender_name,
                    "role": current_role,
                    "text": chat_text,
                    "time": now_str,
                    "file": file_bytes,
                    "file_type": file_type
                })
                st.rerun()

# -------------------------------------------------------------------
# HELPER: ORDER TRACKING MODULE
# -------------------------------------------------------------------
def render_tracking_module():
    st.subheader("🚚 Real-Time Order & Transit Tracker")
    if st.session_state.orders:
        for ord_data in st.session_state.orders:
            with st.expander(f"📦 Order #{ord_data['order_id']} — {ord_data['crop']} ({ord_data['qty']} Qtl)", expanded=True):
                col_t1, col_t2 = st.columns(2)
                with col_t1:
                    st.write(f"👨‍🌾 **Farmer:** {ord_data['farmer_name']}")
                    st.write(f"🛒 **Buyer:** {ord_data['buyer_name']}")
                    st.write(f"📍 **Route:** {ord_data['origin']} ➔ {ord_data['destination']}")
                    st.write(f"🚛 **Assigned Driver:** {ord_data['driver_name']}")
                with col_t2:
                    st.metric(label="Status", value=ord_data['status'])
                    st.write(f"📌 **Current Location:** {ord_data['current_location']}")
                    st.write(f"⏱️ **Estimated Arrival:** {ord_data['eta']}")

                st.progress(75, text="Status Progress: Harvest Picked Up ➔ In Transit to Mandi")
    else:
        st.info("No active shipments currently in transit.")

# -------------------------------------------------------------------
# ROLE 1: FARMER VIEW
# -------------------------------------------------------------------
if "Farmer" in user_role:
    farmer = st.session_state.farmers["FARM001"]

    if farmer["device_id"] in st.session_state.banned_devices or farmer["honor_score"] < 50:
        st.error(l["banned_msg"])
        st.stop()

    st.title(f"👨‍🌾 {farmer['name']} | {l['kyc_status']}")
    
    score = farmer["honor_score"]
    col_s1, col_s2 = st.columns([1, 3])
    with col_s1:
        st.metric(label=l["honor_label"], value=f"{score} / 100")
    with col_s2:
        if score < 70:
            st.warning(l["bulk_disabled_msg"])
        else:
            st.success("✅ Account Status: Active & Full Access")

    st.divider()

    tab_f1, tab_f2, tab_f3, tab_f4 = st.tabs([
        l["farmer_dash"], 
        l["chat_tab"], 
        l["track_tab"], 
        l["cold_tab"]
    ])

    with tab_f1:
        st.markdown(f"### {l['pub_listing']}")
        c1, c2, c3 = st.columns(3)
        with c1:
            crop_name = st.selectbox(l["select_crop"], ["Tomatoes", "Potatoes", "Onions", "Wheat"])
        with c2:
            harvest_date = st.date_input(l["harvest_date"], datetime.date.today())
        with c3:
            quantity_qtl = st.number_input(l["qty_qtl"], min_value=1, max_value=500, value=20)

        apmc_base_rate = {"Tomatoes": 25, "Potatoes": 18, "Onions": 30, "Wheat": 22}[crop_name]
        ai_suggested_rate = apmc_base_rate + 3
        freshness_days = {"Tomatoes": 5, "Potatoes": 45, "Onions": 30, "Wheat": 180}[crop_name]

        st.info(f"💡 **AI Pricing Advisor:** Recommended rate for {crop_name} is **₹{ai_suggested_rate}/kg** (APMC live feed).")

        chosen_rate = st.number_input(l["set_price"], value=float(ai_suggested_rate))

        if st.button(l["btn_publish"]):
            if score < 70 and quantity_qtl > 10:
                st.error("Cannot publish bulk listing (>10 Qtl) because Honor Score is below 70.")
            else:
                listing_id = f"LST-{uuid.uuid4().hex[:4].upper()}"
                farmer["listings"].append({
                    "id": listing_id, "crop": crop_name, "qty": quantity_qtl, 
                    "rate": chosen_rate, "freshness": freshness_days, "status": "Available"
                })
                st.success(f"Harvest listed! Listing ID: #{listing_id}")

        st.divider()
        st.markdown(f"### {l['act_listing']}")
        if farmer["listings"]:
            st.dataframe(pd.DataFrame(farmer["listings"]), use_container_width=True)

            st.markdown("#### Cancel an Order")
            cancel_id = st.selectbox("Select Listing ID to Cancel", [lst["id"] for lst in farmer["listings"]])
            cancel_reason = st.text_area("Reason for Cancellation")
            if st.button("Submit Cancellation Request"):
                st.session_state.cancellations_pending.append({
                    "farmer_id": "FARM001",
                    "listing_id": cancel_id,
                    "reason": cancel_reason,
                    "status": "Pending Audit"
                })
                st.info("Cancellation sent to Ground Representative for verification.")
        else:
            st.write("No active listings.")

    with tab_f2:
        render_chat_module("Ramesh Kumar (Farmer)", "Farmer")

    with tab_f3:
        render_tracking_module()

    with tab_f4:
        st.subheader("🧊 Nearby Cold Storage Facilities")
        cs_df = pd.DataFrame(st.session_state.cold_storages)
        st.dataframe(cs_df, use_container_width=True)
        selected_cs = st.selectbox("Select Cold Storage", cs_df["name"].tolist())
        qtl_to_store = st.number_input("Quintals to Store", min_value=1, max_value=100, value=10)
        if st.button("Reserve Slot"):
            st.success(f"Reserved slot for {qtl_to_store} Quintals at '{selected_cs}'.")

# -------------------------------------------------------------------
# ROLE 2: BUYER VIEW
# -------------------------------------------------------------------
elif "Buyer" in user_role:
    buyer = st.session_state.buyers["BUY001"]
    st.title(f"🛒 {buyer['name']} Portal")

    tab_b1, tab_b2, tab_b3, tab_b4 = st.tabs([
        "🌾 Browse Harvest Listings", 
        l["chat_tab"], 
        l["track_tab"], 
        l["ads_tab"]
    ])

    with tab_b1:
        st.markdown("### Browse Available Farmer Harvests")
        
        all_farmer_listings = []
        for f_id, f_data in st.session_state.farmers.items():
            for lst in f_data.get("listings", []):
                if lst.get("status") == "Available":
                    all_farmer_listings.append({
                        "Farmer ID": f_id,
                        "Farmer Name": f_data.get("name", "Unknown Farmer"),
                        "Location": f_data.get("location", "Nashik, Maharashtra"),
                        "Honor Score": f_data.get("honor_score", 100),
                        "Crop": lst.get("crop", "Produce"),
                        "Qty (Qtl)": lst.get("qty", 0),
                        "Price (₹/kg)": lst.get("rate", 0.0),
                        "Listing ID": lst.get("id", "LST-000")
                    })
        
        if all_farmer_listings:
            df_listings = pd.DataFrame(all_farmer_listings)
            st.dataframe(df_listings[["Listing ID", "Crop", "Qty (Qtl)", "Price (₹/kg)", "Farmer Name", "Location", "Honor Score"]], use_container_width=True)

            st.divider()
            selected_listing_id = st.selectbox("Select Listing ID", [item["Listing ID"] for item in all_farmer_listings])
            selected_item = next(item for item in all_farmer_listings if item["Listing ID"] == selected_listing_id)
            selected_farmer = st.session_state.farmers[selected_item["Farmer ID"]]

            with st.expander("🔍 View Farmer Profile & Trust Card", expanded=True):
                mc1, mc2, mc3 = st.columns(3)
                with mc1:
                    st.subheader(f"👨‍🌾 {selected_farmer.get('name', 'Farmer')}")
                    st.write(f"📍 **Location:** {selected_farmer.get('location', 'Nashik, Maharashtra')}")
                    st.write(f"🆔 **Aadhaar Status:** Verified (e-KYC)")
                with mc2:
                    st.metric(label="⭐ Honor Score", value=f"{selected_farmer.get('honor_score', 100)} / 100")
                    st.write(f"📱 **Registered Device:** `{selected_farmer.get('device_id', CURRENT_DEVICE_ID)}`")
                with mc3:
                    tot_orders = selected_farmer.get('total_orders', 0)
                    pos_rev = selected_farmer.get('positive_reviews', 0)
                    fulfillment_rate = round((pos_rev / tot_orders) * 100, 1) if tot_orders > 0 else 100.0
                    st.metric(label="👍 Fulfillment Rate", value=f"{fulfillment_rate}%")

            if st.button("🔒 Lock Escrow & Confirm Purchase", type="primary"):
                new_ord_id = f"ORD-{len(st.session_state.orders)+9902}"
                st.session_state.orders.append({
                    "order_id": new_ord_id,
                    "listing_id": selected_listing_id,
                    "farmer_name": selected_farmer['name'],
                    "buyer_name": buyer['name'],
                    "crop": selected_item['Crop'],
                    "qty": selected_item['Qty (Qtl)'],
                    "amount": selected_item['Qty (Qtl)'] * selected_item['Price (₹/kg)'] * 100,
                    "status": "Logistics Assigned",
                    "origin": selected_farmer.get('location', 'Nashik'),
                    "destination": "Buyer Hub Center",
                    "current_location": "Pickup Initiated from Farm",
                    "eta": "4 Hours",
                    "driver_name": "Ramesh Express Logistics (+91 99887-11223)"
                })
                st.success(f"Order #{new_ord_id} placed successfully! Escrow locked and live location tracking enabled.")
        else:
            st.info("No active farmer listings available currently.")

    with tab_b2:
        render_chat_module("AgriCorp (Buyer)", "Buyer")

    with tab_b3:
        render_tracking_module()

    with tab_b4:
        st.markdown("### 📢 Post Reverse Buyer Procurement Ad")
        with st.form("buyer_ad_form"):
            ad_crop = st.selectbox("Crop Needed", ["Tomatoes", "Potatoes", "Onions", "Wheat"])
            ad_qty = st.number_input("Target Quantity (Quintals)", value=50)
            ad_rate = st.number_input("Offered Rate (₹/kg)", value=25)
            submitted = st.form_submit_button("Publish Requirement")
            if submitted:
                new_ad_id = f"AD-{len(st.session_state.buyer_ads)+101}"
                st.session_state.buyer_ads.append({
                    "id": new_ad_id, "crop": ad_crop, "required_qty_qtl": ad_qty, 
                    "offered_rate": ad_rate, "buyer_name": buyer["name"]
                })
                st.success("Procurement Ad live!")

        st.markdown("#### Your Active Ads")
        st.dataframe(pd.DataFrame(st.session_state.buyer_ads), use_container_width=True)

# -------------------------------------------------------------------
# ROLE 3: FIELD REPRESENTATIVE AUDIT VIEW
# -------------------------------------------------------------------
elif "Field Representative" in user_role:
    st.title("🕵️ Ground Representative Audit Dashboard")
    st.write("Review cancellation requests submitted by farmers.")

    farmer = st.session_state.farmers["FARM001"]
    if st.session_state.cancellations_pending:
        for idx, item in enumerate(st.session_state.cancellations_pending):
            st.warning(f"**Cancellation Request #{idx+1}** | Farmer ID: {item['farmer_id']} | Listing: #{item['listing_id']}")
            st.write(f"**Reason Claimed:** {item['reason']}")
            
            col_a, col_b = st.columns(2)
            with col_a:
                if st.button(f"Verify & Approve (No Penalty)", key=f"app_{idx}"):
                    st.session_state.cancellations_pending.pop(idx)
                    st.success("Verified valid claim. Penalty waived.")
                    st.rerun()
            with col_b:
                if st.button(f"Reject Claim (Deduct 25 Pts)", key=f"rej_{idx}"):
                    farmer["honor_score"] -= 25
                    if farmer["honor_score"] < 50:
                        st.session_state.banned_devices.append(farmer["device_id"])
                    st.session_state.cancellations_pending.pop(idx)
                    st.error(f"Claim rejected. 25 Honor Points deducted. New Score: {farmer['honor_score']}")
                    st.rerun()
    else:
        st.info("No pending cancellation audits.")
