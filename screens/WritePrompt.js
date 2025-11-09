import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import React, {useMemo, useState, useEffect, useRef} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WritePrompt = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const question = route?.params?.question;
  const {index, prompts, setPrompts} = route.params;
  const [answer, setAnswer] = useState('');
  const [savedDraft, setSavedDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef(null);
  const MAX_CHARS = 250;
  const draftKey = useMemo(() => `prompt_draft_${(question || 'unknown').slice(0, 50)}`, [question]);
  
  // Lightweight, local-only suggestions — no DB changes
  const suggestions = useMemo(() => {
    const q = (question || '').toLowerCase();
    if (q.includes('green flag') || q.includes('red flag') || q.includes('dating')) {
      return [
        'Kindness to others',
        'Clear communication',
        'Consistent effort',
        'Respect for boundaries',
        'Humor and empathy',
      ];
    }
    if (q.includes('perfect first date') || q.includes('first date')) {
      return [
        'Coffee + bookstore stroll',
        'Picnic in the park',
        'Street food and a walk',
        'Mini golf + ice cream',
        'Sunset by the waterfront',
      ];
    }
    if (q.includes('weekend') || q.includes('sunday') || q.includes('day off')) {
      return [
        'Farmers market',
        'Gym + brunch',
        'Hike with friends',
        'Cooking something new',
        'Netflix and recharge',
      ];
    }
    // Default fallback suggestions
    return [
      'Travel story',
      'Hidden talent',
      'Favorite comfort food',
      'A recent win',
      'What I’m learning now',
    ];
  }, [question]);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const saved = await AsyncStorage.getItem(draftKey);
        if (saved) {
          setSavedDraft(saved);
          // Only prefill if no existing answer
          if (!answer) {
            setAnswer(saved);
          }
        }
      } catch (e) {
        // silently ignore
      }
    };
    loadDraft();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draftKey]);

  // Debounced autosave when answer changes
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setIsSaving(true);
    saveTimerRef.current = setTimeout(async () => {
      try {
        if (answer && answer.trim().length > 0) {
          await AsyncStorage.setItem(draftKey, answer);
          setSavedDraft(answer);
        } else {
          await AsyncStorage.removeItem(draftKey);
          setSavedDraft('');
        }
      } catch (e) {
        // ignore
      } finally {
        setIsSaving(false);
      }
    }, 400);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [answer, draftKey]);

  const handleRestoreDraft = () => {
    if (savedDraft && savedDraft !== answer) {
      setAnswer(savedDraft);
    }
  };

  const handleClearDraft = async () => {
    try {
      await AsyncStorage.removeItem(draftKey);
      setSavedDraft('');
    } catch (e) {}
  };

  const handleDone = async () => {
    const updatedPrompts = [...prompts];
    updatedPrompts[index] = {question,answer};
    // Clear draft after saving
    try { await AsyncStorage.removeItem(draftKey); } catch(e) {}
    navigation.replace("Prompts",{updatedPrompts});
  }
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
      }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} style={{flex:1}}>
      <ScrollView contentContainerStyle={{flexGrow:1}} keyboardShouldPersistTaps="handled">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'white',
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            gap: 5,
          }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={25} color="black" />
          </Pressable>
          <Text style={{fontSize: 15}}>Write Answer</Text>
        </View>
        <Pressable onPress={handleDone} disabled={!(answer && answer.trim().length > 0) || answer.length > MAX_CHARS}>
          <Text
            style={{
              fontSize: 15,
              color: (!(answer && answer.trim().length > 0) || answer.length > MAX_CHARS) ? '#999' : '#5a0763',
              marginRight: 10,
              fontWeight: '500',
            }}>
            Done
          </Text>
        </Pressable>
      </View>

      <View style={{padding: 12}}>
        <View style={{backgroundColor: 'white', padding: 15, borderRadius: 5}}>
          <Text>{question}</Text>

        </View>

        {/* Suggestions chips */}
        <View style={{marginTop: 12}}>
          <Text style={{marginBottom: 8, color: '#555'}}>Suggestions</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
            {suggestions.map((s, idx) => (
              <Pressable
                key={idx}
                onPress={() => setAnswer(s)}
                style={{
                  backgroundColor: '#f2e9f5',
                  borderColor: '#5a0763',
                  borderWidth: 0.5,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 16,
                }}>
                <Text style={{color: '#5a0763'}}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View
            style={{
              padding: 10,
              borderRadius: 10,
              height: 100,
              marginTop: 15,
              backgroundColor: 'white',
            }}>
          <TextInput
              multiline
              placeholder="Enter your answer"
              value={answer}
              onChangeText={text => setAnswer(text)}
              style={{fontFamily: 'Helvetica', fontSize: answer ? 17 : 17, color:'#000'}}
              placeholderTextColor={'#BEBEBE'}
            />
          </View>

          {/* Character counter and autosave status */}
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingHorizontal: 2}}>
            <Text style={{color: answer.length > MAX_CHARS ? '#c0392b' : '#666'}}>
              Characters: {answer.length}/{MAX_CHARS}
            </Text>
            {isSaving ? (
              <Text style={{color: '#666'}}>Saving…</Text>
            ) : savedDraft ? (
              <Text style={{color: '#2d7d46'}}>Draft saved</Text>
            ) : (
              <Text style={{color: '#666'}}>No draft</Text>
            )}
          </View>

          {/* Quick actions */}
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12}}>
            <Pressable
              onPress={() => setAnswer('')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'white',
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderColor: '#ddd',
                borderWidth: 1,
              }}>
              <Ionicons name="refresh-outline" size={18} color="#333" />
              <Text>Clear</Text>
            </Pressable>

            <Pressable
              onPress={() => setAnswer(prev => (prev ? prev : (suggestions[0] || '')))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#5a0763',
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}>
              <Ionicons name="flash-outline" size={18} color="#fff" />
              <Text style={{color: 'white'}}>Quick Fill</Text>
            </Pressable>

            <Pressable
              onPress={handleRestoreDraft}
              disabled={!savedDraft || savedDraft === answer}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'white',
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderColor: '#ddd',
                borderWidth: 1,
                opacity: !savedDraft || savedDraft === answer ? 0.6 : 1,
              }}>
              <Ionicons name="download-outline" size={18} color="#333" />
              <Text>Restore Draft</Text>
            </Pressable>

            <Pressable
              onPress={handleClearDraft}
              disabled={!savedDraft}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'white',
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderColor: '#ddd',
                borderWidth: 1,
                opacity: !savedDraft ? 0.6 : 1,
              }}>
              <Ionicons name="trash-outline" size={18} color="#333" />
              <Text>Clear Draft</Text>
            </Pressable>
          </View>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WritePrompt;

const styles = StyleSheet.create({});
