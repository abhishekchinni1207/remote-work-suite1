const Y = require('yjs');
const { createClient } = require('@supabase/supabase-js');


const SUPABASE_URL = "https://zsmszewrcxlktgkpjmqu.supabase.co";
const SUPABASE_KEY = "sb_secret_KERunFHVVWJ4VBmP5HKl8A_LvMdlEJz";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

 
async function loadDocument(docName) {
  try {
    console.log(`📥 Attempting to load document from Supabase: ${docName}`);
    
    const { data, error } = await supabase
      .from('documents_yjs')
      .select('data')  // Changed from 'document_data' to 'data'
      .eq('id', docName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log(`📄 No existing document found for: ${docName}, will create new`);
        return null;
      }
      throw error;
    }

    if (!data || !data.data) {
      console.log(`📄 Document found but no data for: ${docName}`);
      return null;
    }

    // Create new Y.Doc and apply the saved update
    const ydoc = new Y.Doc();
    
    // Handle bytea data from Supabase
    let updateData;
    if (data.data instanceof Buffer) {
      // If it's already a Buffer
      updateData = new Uint8Array(data.data);
    } else if (typeof data.data === 'string') {
      // If it's a hex string (common with bytea)
      // Remove any \x prefix that Postgres might add
      const hexString = data.data.startsWith('\\x') ? data.data.slice(2) : data.data;
      updateData = new Uint8Array(Buffer.from(hexString, 'hex'));
    } else {
      console.log('❓ Unknown data format:', typeof data.data, data.data);
      return null;
    }

    // Apply the update to the document
    Y.applyUpdate(ydoc, updateData, 'persistence');
    console.log(`✅ Successfully loaded document: ${docName}, data length: ${updateData.length}`);
    
    return ydoc;

  } catch (error) {
    console.error(`❌ Error loading document ${docName}:`, error);
    return null;
  }
}

async function saveDocument(docName, ydoc) {
  try {
    console.log(`💾 Attempting to save document to Supabase: ${docName}`);
    
    // Encode the document state as update
    const update = Y.encodeStateAsUpdate(ydoc);
    
    // Convert to hex string for bytea storage
    const hexData = Buffer.from(update).toString('hex');
    
    const { error } = await supabase
      .from('documents_yjs')
      .upsert({
        id: docName,
        data: hexData,  // Changed from 'document_data' to 'data'
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully saved document: ${docName}`);
    
  } catch (error) {
    console.error(`❌ Error saving document ${docName}:`, error);
    throw error;
  }
}

// Debug function to check your current data
async function debugDocument(docName) {
  try {
    const { data, error } = await supabase
      .from('documents_yjs')
      .select('*')
      .eq('id', docName)
      .single();

    if (error) {
      console.log('❌ Debug: Error fetching document:', error);
      return;
    }

    console.log('🔍 Debug: Document data from Supabase:', {
      id: data.id,
      has_data: !!data.data,
      data_type: typeof data.data,
      data_length: data.data?.length,
      data_sample: data.data ? data.data.substring(0, 100) + '...' : null,
      updated_at: data.updated_at
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

module.exports = {
  loadDocument,
  saveDocument,
  debugDocument // Export for temporary debugging
};