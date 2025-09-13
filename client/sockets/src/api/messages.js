import axios from "axios"

export async function apiGetUserChats(token,backendUrl,receiverId){

    let response = await axios.get(`${backendUrl}/api/messages/userchats/${receiverId}`,{headers:{Authorization: `Bearer ${token}`}})
    console.log(response);
    return response;

}

export async function apiDeleteMessages(token,backendUrl,messageId){
    let response = await axios.patch(`${backendUrl}/api/messages/deletechats/${messageId}`,{},{headers:{Authorization:`Bearer ${token}`}})
    console.log(response)
    return response
}