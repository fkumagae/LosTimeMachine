// Propriedades do script: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DRIVE_FOLDER_ID.
function doPost(event) {
  function json(value) {
    return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const input = JSON.parse(event.postData.contents);
    const config = PropertiesService.getScriptProperties();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(input.type) ||
        typeof input.base64 !== 'string' || input.base64.length > 6990510 ||
        typeof input.token !== 'string' || !input.token) return json({error:'Entrada inválida'});
    const headers = {Authorization:'Bearer ' + input.token, apikey:config.getProperty('SUPABASE_PUBLISHABLE_KEY')};
    const response = UrlFetchApp.fetch(config.getProperty('SUPABASE_URL') +
      '/rest/v1/participant_accounts?select=participant_id&limit=1', {headers:headers, muteHttpExceptions:true});
    if (response.getResponseCode() !== 200 || JSON.parse(response.getContentText()).length !== 1) return json({error:'Sem vínculo'});
    const bytes = Utilities.base64Decode(input.base64);
    const prefix = bytes.slice(0,12).map(v=>(v+256)%256);
    const ascii = String.fromCharCode.apply(null,prefix);
    const valid = input.type === 'image/jpeg' ? prefix[0]===255 && prefix[1]===216 && prefix[2]===255 :
      input.type === 'image/png' ? prefix.slice(0,8).join(',')==='137,80,78,71,13,10,26,10' :
      ascii.slice(0,4)==='RIFF' && ascii.slice(8,12)==='WEBP';
    if (!valid || bytes.length > 5242880) return json({error:'Imagem inválida'});
    const file = DriveApp.getFolderById(config.getProperty('DRIVE_FOLDER_ID')).createFile(
      Utilities.newBlob(bytes,input.type,Utilities.getUuid()+'.'+input.type.split('/')[1]));
    // O arquivo herda as permissões da pasta indicada pelo organizador.
    return json({url:'https://lh3.googleusercontent.com/d/'+file.getId()});
  } catch (_) { return json({error:'Falha ao armazenar imagem'}); }
}
