#include<iostream>
#include<vector>
#include<climits>
#include<string>
#include<unordered_map>
using namespace std;




void slidingWindow(string &s,string &b,unordered_map<char,int>mp){

for(int i=0;i<b.size();i++){
    mp[b[i]]++;
}
int right =0;
int left =0;
int len=0;
int start=0;
int minlen = INT_MAX;
int required = b.size();
    while(right<s.size()){
            
        
           if(mp.find(s[right]) != mp.end()){
    if(mp[s[right]] > 0)
        required--;
    mp[s[right]]--;
}

            right++;

        

        while(required==0){
            if(right-left<minlen){
                minlen=min(minlen,right-left);
                start = left;
            }

            if(mp.find(s[left])!=mp.end()){
                mp[s[left]]++;
                if(mp[s[left]]>0){
                    required++;
                }
            }

            left++;

        }


    }
if(minlen==INT_MAX){
    cout<<"no string exist";
}
else{
    cout<<s.substr(start,minlen);
}

}







int main(){
unordered_map<char,int>mp;
string s ="ADOBECOADEBANC";
string b = "ABC";
slidingWindow(s,b,mp);
return 0;






}